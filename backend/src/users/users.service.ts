import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from './user.entity'; // or wherever it's defined

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ── Auth ──
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOneBy({ username });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  // ── Staff directory (public) ──
  async findPublicDirectory(): Promise<Partial<User>[]> {
    return this.userRepository.find({
      where: { role: UserRole.STAFF },
      select: [
        'id', 'username', 'displayName', 'jobTitle',
        'bio', 'location', 'photoUrl', 'photoAlt',
      ] as any,
      order: { displayName: 'ASC' },
    });
  }

  async findByUsername_public(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      select: [
        'id', 'username', 'displayName', 'jobTitle',
        'bio', 'location', 'photoUrl', 'photoAlt',
        'customFields', 'role',
      ] as any,
    });
  }

  // ── Admin user management ──
  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
    return users.map(u => {
      const { password, ...safe } = u as any;
      return safe;
    });
  }

  async findStaff(): Promise<User[]> {
    const users = await this.userRepository.find({
      where: [
        { role: UserRole.ADMIN},
        { role: UserRole.EDITOR},
        { role: UserRole.STAFF},
        { role: UserRole.VIEWER},
      ],
      order: { displayName: 'ASC' },
    });
    return users.map(u => {
      const { password, ...safe } = u as any;
      return safe;
    });
  }

  async create(data: {
    username: string;
    password: string;
    email?: string;
    displayName?: string;
    role?: UserRole;
  }): Promise<User> {
    const hashed = await bcrypt.hash(data.password, 10);

    const user = this.userRepository.create({
      ...data,
      role: data.role ?? UserRole.VIEWER, // default safely
      password: hashed,
    });

    const saved = await this.userRepository.save(user);
    const { password, ...safe } = saved as any;
    return safe;
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    // Never allow password update through this method
    const { password, ...safe } = data as any;
    await this.userRepository.update(id, safe);
    const updated = await this.userRepository.findOneBy({ id });
    if (!updated) return null;
    const { password: pw, ...safeUpdated } = updated as any;
    return safeUpdated;
  }

  async updatePassword(id: number, newPassword: string): Promise<void> {
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(id, { password: hashed });
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  // ── Search (for circulation desk etc.) ──
  async search(q: string, role?: string): Promise<Partial<User>[]> {
    const qb = this.userRepository.createQueryBuilder('user')
      .where('user.username ILIKE :q OR user.displayName ILIKE :q OR user.email ILIKE :q', { q: `%${q}%` });

    if (role) qb.andWhere('user.role = :role', { role });

    const users = await qb.take(20).getMany();
    return users.map(u => {
      const { password, ...safe } = u as any;
      return safe;
    });
  }

  // ── Setup: create first admin ──
  async createFirstAdmin(username: string, password: string): Promise<User> {
    const hashed = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      username,
      password: hashed,
      role: UserRole.ADMIN,
      displayName: username,
    });
    return this.userRepository.save(user);
  }

  async count(): Promise<number> {
    return this.userRepository.count();
  }

  // ── Me endpoint ──
  async getMe(id: number): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return null;
    const { password, ...safe } = user as any;
    return safe;
  }

  async updateMe(id: number, data: {
    displayName?: string;
    jobTitle?: string;
    bio?: string;
    location?: string;
    photoUrl?: string;
    photoAlt?: string;
    email?: string;
    phone?: string;
    customFields?: Record<string, any>;
  }): Promise<Partial<User> | null> {
    await this.userRepository.update(id, data);
    return this.getMe(id);
  }
}
