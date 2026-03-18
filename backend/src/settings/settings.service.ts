import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  async get(key: string): Promise<string | null> {
    const setting = await this.settingsRepository.findOneBy({ key });
    return setting?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    const existing = await this.settingsRepository.findOneBy({ key });
    if (existing) {
      await this.settingsRepository.update(existing.id, { value });
    } else {
      await this.settingsRepository.save(
        this.settingsRepository.create({ key, value })
      );
    }
  }

  async getPublicSettings(): Promise<Record<string, string>> {
    const publicKeys = [
      'library_name',
      'library_tagline',
      'library_email',
      'library_phone',
      'library_address',
      'library_city',
      'library_logo_url',
      'theme_primary_colour',
    ];
    const result: Record<string, string> = {};
    for (const key of publicKeys) {
      const value = await this.get(key);
      if (value) result[key] = value;
    }
    return result;
  }

  async isSetupComplete(): Promise<boolean> {
    const value = await this.get('is_setup_complete');
    return value === 'true';
  }

  async completeSetup(data: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      if (value) await this.set(key, value);
    }
    await this.set('is_setup_complete', 'true');
  }
}