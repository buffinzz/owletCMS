import { DynamicModule, Type } from '@nestjs/common';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

export interface PluginManifest {
  name: string;
  version: string;
  displayName: string;
  description: string;
  author: string;
  owletVersion: string;
  permissions?: string[];
  adminTabs?: PluginTab[];
  publicRoutes?: string[];
  patronRoutes?: string[];
  settings?: PluginSetting[];
}

export interface PluginTab {
  id: string;
  label: string;
  roles: string[];
}

export interface PluginSetting {
  key: string;
  default: string;
  label: string;
  type: 'string' | 'number' | 'boolean';
}

export interface OwletPlugin {
  manifest: PluginManifest;
  getModule(): Type<any> | DynamicModule;
  getEntities(): EntityClassOrSchema[];
}
