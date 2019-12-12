import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    OneToMany,
    ManyToMany,
    JoinTable,
} from 'typeorm';
import { BaseEntity } from 'typeorm/repository/BaseEntity';
import { IsString, IsDate, IsOptional, IsUrl } from 'class-validator';

import Event from '../events/entity';
import User from '../users/entity';

@Entity()
export default class Image extends BaseEntity {
    @PrimaryColumn()
    id: string;

    @IsString()
    @Column('varchar')
    url: string;

    @IsString()
    @Column('text')
    mimeType: string;

    @IsOptional()
    @IsString()
    @Column('varchar', { nullable: true })
    note?: string;

    @IsDate()
    @Column('timestamp')
    createdAt: Date;

    @IsOptional()
    @Column('float8', { nullable: true })
    latitude?: number;

    @IsOptional()
    @Column('float8', { nullable: true })
    longitude?: number;

    @ManyToOne(
        () => User,
        user => user.images
    )
    user: User;

    @ManyToOne(
        () => Event,
        event => event.images
    )
    event: Event;
}
