import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import {
    IsEmail,
    IsOptional,
    IsString,
    IsUrl,
    MinLength,
} from 'class-validator';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from 'typeorm/repository/BaseEntity';

import Event from '../events/entity';
import Trip from '../trips/entity';
import Image from '../images/entity';

@Entity()
export default class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id?: number;

    @MinLength(2)
    @Column('text', { unique: true })
    username: string;

    @IsEmail()
    @Column('text', { unique: true })
    email: string;

    @IsString()
    //@MinLength(8)
    @Column('text')
    @Exclude({ toPlainOnly: true })
    password: string;

    @IsOptional()
    @IsUrl()
    @Column('varchar', { nullable: true })
    avatarUrl?: string;

    async setPassword(rawPassword: string) {
        const hash = await bcrypt.hash(rawPassword, 10);
        this.password = hash;
    }

    checkPassword(rawPassword: string): Promise<boolean> {
        return bcrypt.compare(rawPassword, this.password);
    }

    @OneToMany(
        () => Trip,
        trip => trip.creator
    )
    trips: Trip[];

    @OneToMany(
        () => Event,
        event => event.user
    )
    events: Event[];

    @OneToMany(
        () => Image,
        image => image.user
    )
    images: Image[];
}
