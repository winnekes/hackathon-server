import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { BaseEntity } from 'typeorm/repository/BaseEntity';
import { IsString, IsDate, IsOptional } from 'class-validator';

import User from '../users/entity';
import Trip from '../trips/entity';
import Image from '../images/entity';

@Entity()
export default class Event extends BaseEntity {
    @PrimaryGeneratedColumn()
    id?: number;

    @IsString()
    @Column('text')
    title: string;

    @IsString()
    @Column('text')
    destination: string;

    @IsString()
    @Column('text')
    color: string;

    @IsOptional()
    @IsString()
    @Column('varchar', { nullable: true })
    note: string;

    @Column('timestamp')
    startsAt: Date;

    @Column('timestamp')
    endsAt: Date;

    @ManyToOne(
        () => User,
        user => user.events
    )
    user: User;

    @ManyToOne(
        () => Trip,
        trip => trip.events
    )
    trip: Trip;

    @OneToMany(
        () => Image,
        image => image.event
    )
    images: Image[];
}
