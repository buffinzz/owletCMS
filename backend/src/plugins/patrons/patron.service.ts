import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User, UserRole } from '../../users/user.entity';
import { PatronProfile } from './patron-profile.entity';
import * as bcrypt from 'bcrypt';
import { SettingsService } from '../../settings/settings.service';

export interface PatronWithProfile {
  id: number;
  username: string;
  displayName?: string;
  email?: string;
  role: string;
  profile: PatronProfile | null;
}

@Injectable()
export class PatronService {
  private readonly logger = new Logger(PatronService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PatronProfile)
    private profileRepository: Repository<PatronProfile>,
    private settingsService: SettingsService,
  ) {}

  // ── Helpers ──
  private async buildPatronWithProfile(user: User): Promise<PatronWithProfile> {
    const profile = await this.profileRepository.findOneBy({ userId: user.id });
    return { ...this.sanitizeUser(user), profile };
  }

  private sanitizeUser(user: User) {
    const { password, ...safe } = user as any;
    return safe;
  }

  private async syncPatronRoles(): Promise<void> {
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ role: UserRole.PATRON })
      .where(`
        id IN (
          SELECT "userId"
          FROM patron_profile
        )
      `)
      .andWhere('role <> :role', { role: UserRole.PATRON })
      .execute();
  }

  // ── Registration settings ──
  getRegistrationSettings() {
    return {
      selfRegistrationEnabled: true, // overridden below
      requireApproval: false,
      cardPrefix: 'LIB',
    };
  }

  async getRegistrationSettingsFromDb() {
    const [selfReg, requireApproval, cardPrefix] = await Promise.all([
      this.settingsService.get('patron_self_registration'),
      this.settingsService.get('patron_require_approval'),
      this.settingsService.get('patron_card_prefix'),
    ]);
    return {
      selfRegistrationEnabled: selfReg !== 'false',
      requireApproval: requireApproval === 'true',
      cardPrefix: cardPrefix || 'LIB',
    };
  }

  // ── Card number generation ──
  async generateCardNumber(): Promise<string> {
    const { cardPrefix } = await this.getRegistrationSettingsFromDb();
    const prefix = process.env.PATRON_CARD_PREFIX || 'LIB';
    const count = await this.profileRepository.count();
    let cardNumber: string;
    let attempts = 0;
    do {
      cardNumber = `${prefix}${String(count + 1 + attempts).padStart(8, '0')}`;
      const existing = await this.profileRepository.findOneBy({ libraryCardNumber: cardNumber });
      if (!existing) break;
      attempts++;
    } while (attempts < 100);
    return cardNumber;
  }

  // ── Self-registration ──
  async register(data: {
    username: string;
    password: string;
    email: string;
    displayName?: string;
    preferredName?: string;
  }): Promise<PatronWithProfile> {
    const { selfRegistrationEnabled, requireApproval } = await this.getRegistrationSettingsFromDb();

    if (!selfRegistrationEnabled) {
      throw new BadRequestException('Self-registration is currently disabled.');
    }

    const existingUsername = await this.userRepository.findOneBy({ username: data.username });
    if (existingUsername) throw new BadRequestException('Username already taken.');

    const existingEmail = await this.userRepository.findOneBy({ email: data.email });
    if (existingEmail) throw new BadRequestException('Email already registered.');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const cardNumber = await this.generateCardNumber();

    // Create the core User record
    const user = await this.userRepository.save(
      this.userRepository.create({
        username: data.username,
        password: hashedPassword,
        email: data.email,
        displayName: data.displayName || data.username,
        role: UserRole.PATRON,
      })
    );

    // Create the PatronProfile record
    const profile = await this.profileRepository.save(
      this.profileRepository.create({
        userId: user.id,
        preferredName: data.preferredName,
        libraryCardNumber: cardNumber,
        isApproved: !requireApproval,
        notifyByEmail: true,
      })
    );

    this.logger.log(`New patron registered: ${user.username} (${cardNumber})`);
    return { ...this.sanitizeUser(user), profile };
  }

  // ── Staff creates patron ──
  async createPatron(data: {
    username: string;
    password?: string;
    email?: string;
    displayName?: string;
    preferredName?: string;
    libraryCardNumber?: string;
    notes?: string;
  }): Promise<PatronWithProfile> {
    const existing = await this.userRepository.findOneBy({ username: data.username });
    if (existing) throw new BadRequestException('Username already taken.');

    const hashedPassword = await bcrypt.hash(data.password || 'changeme', 10);
    const cardNumber = data.libraryCardNumber || await this.generateCardNumber();

    const user = await this.userRepository.save(
      this.userRepository.create({
        username: data.username,
        password: hashedPassword,
        email: data.email,
        displayName: data.displayName || data.username,
        role: UserRole.PATRON,
      })
    );

    const profile = await this.profileRepository.save(
      this.profileRepository.create({
        userId: user.id,
        preferredName: data.preferredName,
        libraryCardNumber: cardNumber,
        isApproved: true, // staff-created accounts auto-approved
        notifyByEmail: true,
        notes: data.notes,
      })
    );

    this.logger.log(`Patron created by staff: ${user.username} (${cardNumber})`);
    return { ...this.sanitizeUser(user), profile };
  }

  // ── Find patrons ──
  async findAll(): Promise<PatronWithProfile[]> {
    await this.syncPatronRoles();
    const users = await this.userRepository.find({
      where: { role: UserRole.PATRON },
      order: { createdAt: 'DESC' },
    });
    return Promise.all(users.map(u => this.buildPatronWithProfile(u)));
  }

  async findOne(id: number): Promise<PatronWithProfile | null> {
    await this.syncPatronRoles();
    const user = await this.userRepository.findOneBy({ id, role: UserRole.PATRON });
    if (!user) return null;
    return this.buildPatronWithProfile(user);
  }

  async findByCardNumber(cardNumber: string): Promise<PatronWithProfile | null> {
    await this.syncPatronRoles();
    const profile = await this.profileRepository.findOneBy({ libraryCardNumber: cardNumber });
    if (!profile) return null;
    const user = await this.userRepository.findOneBy({ id: profile.userId });
    if (!user) return null;
    return { ...this.sanitizeUser(user), profile };
  }

  async search(q: string): Promise<PatronWithProfile[]> {
    await this.syncPatronRoles();
    // Search users
    const users = await this.userRepository.find({
      where: [
        { role: UserRole.PATRON, username: ILike(`%${q}%`) },
        { role: UserRole.PATRON, displayName: ILike(`%${q}%`) },
        { role: UserRole.PATRON, email: ILike(`%${q}%`) },
      ],
      take: 20,
    });

    // Also search by card number
    const profileMatch = await this.profileRepository.findOne({
      where: { libraryCardNumber: ILike(`%${q}%`) },
    });
    if (profileMatch) {
      const user = await this.userRepository.findOneBy({ id: profileMatch.userId });
      if (user && !users.find(u => u.id === user.id)) {
        users.push(user);
      }
    }

    return Promise.all(users.map(u => this.buildPatronWithProfile(u)));
  }

  // ── Update ──
  async update(id: number, data: {
    displayName?: string;
    email?: string;
    profile?: Partial<PatronProfile>;
  }): Promise<PatronWithProfile | null> {
    const { profile: profileData, ...userData } = data;

    if (Object.keys(userData).length > 0) {
      await this.userRepository.update(id, userData);
    }

    if (profileData) {
      await this.profileRepository.upsert(
        { userId: id, ...profileData },
        ['userId']
      );
    }

    return this.findOne(id);
  }

  async approve(id: number): Promise<PatronWithProfile | null> {
    await this.profileRepository.upsert(
      { userId: id, isApproved: true },
      ['userId']
    );
    return this.findOne(id);
  }

  async resetPassword(id: number, newPassword: string): Promise<void> {
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(id, { password: hashed });
  }

  // ── Patron self-service ──
  async getPortalData(userId: number): Promise<PatronWithProfile | null> {
    return this.findOne(userId);
  }

  async updateProfile(userId: number, data: {
    displayName?: string;
    preferredName?: string;
    notifyByEmail?: boolean;
    readingInterests?: string[];
  }): Promise<PatronWithProfile | null> {
    const { displayName, ...profileData } = data;

    if (displayName) {
      await this.userRepository.update(userId, { displayName });
    }

    if (Object.keys(profileData).length > 0) {
      await this.profileRepository.upsert(
        { userId, ...profileData },
        ['userId']
      );
    }

    return this.findOne(userId);
  }

  // ── Update last login (called from auth service) ──
  async updateLastLogin(userId: number): Promise<void> {
    await this.profileRepository.upsert(
      { userId, lastLoginAt: new Date() },
      ['userId']
    );
  }

  // ── Pending approvals ──
  async findPendingApproval(): Promise<PatronWithProfile[]> {
    await this.syncPatronRoles();
    const profiles = await this.profileRepository.find({
      where: { isApproved: false },
      order: { createdAt: 'ASC' },
    });
    const results: PatronWithProfile[] = [];
    for (const profile of profiles) {
      const user = await this.userRepository.findOneBy({ id: profile.userId });
      if (user) results.push({ ...this.sanitizeUser(user), profile });
    }
    return results;
  }
}
