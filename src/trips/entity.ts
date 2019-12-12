import {
    Entity,
    PrimaryGeneratedColumn,
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
export default class Trip extends BaseEntity {
    @PrimaryGeneratedColumn()
    id?: number;

    @IsString()
    @Column('text')
    title: string;

    @IsString()
    @Column('text')
    destination: string;

    @IsOptional()
    @IsUrl()
    @Column('varchar')
    image?: string;

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
        user => user.trips
    )
    creator: User;

    @ManyToMany(() => User)
    @JoinTable({ name: 'trip_members' })
    members: User[];

    @OneToMany(
        () => Event,
        event => event.trip
    )
    events: Event[];
}
