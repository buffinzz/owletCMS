import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ username });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  // Public directory — never expose password, private fields
  async findDirectory(): Promise<Partial<User>[]> {
    return this.usersRepository.find({
      select: ['id', 'username', 'displayName', 'jobTitle', 'bio', 'location', 'photoUrl', 'customFields'],
    });
}
  
  async create(username: string, password: string, role: UserRole = UserRole.VIEWER): Promise<User> {
    const hashed = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({ username, password: hashed, role });
    return this.usersRepository.save(user);
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    // Never allow password to be updated this way
    delete data.password;
    await this.usersRepository.update(id, data);
    return this.usersRepository.findOneBy({ id });
  }

  async updatePassword(id: number, password: string): Promise<void> {
    const hashed = await bcrypt.hash(password, 10);
    await this.usersRepository.update(id, { password: hashed });
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'username', 'displayName', 'jobTitle', 'role', 'email', 'lastLoginAt', 'createdAt'],
    });
  }
}
