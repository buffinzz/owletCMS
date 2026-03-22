import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum NavItemType {
  PAGE = 'page',
  URL = 'url',
  COLLECTION = 'collection',
  EVENTS = 'events',
  STAFF = 'staff',
  DIGITAL_RESOURCES = 'digital_resources',
  ANCHOR = 'anchor',
}

export enum NavArea {
  HEADER = 'header',
  FOOTER = 'footer',
}

@Entity()
export class NavItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  label: string;

  @Column({
    type: 'enum',
    enum: NavItemType,
    default: NavItemType.URL,
  })
  type: NavItemType;

  @Column({ nullable: true })
  value: string; // slug, url, or anchor

  @Column({ nullable: true })
  target: string; // '_blank' for external

  @Column({ nullable: true })
  parentId: number;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isVisible: boolean;

  @Column({
    type: 'enum',
    enum: NavArea,
    default: NavArea.HEADER,
  })
  area: NavArea;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}