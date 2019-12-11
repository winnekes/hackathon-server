import {
    Authorized,
    Body,
    CurrentUser,
    Delete,
    Get,
    JsonController,
    NotFoundError,
    Param,
    Post,
    Put,
    Res,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi/build/decorators';
import User from '../users/entity';
import Trip from './entity';

@JsonController()
@OpenAPI({
    security: [{ bearerAuth: [] }],
})
export default class TripController {
    @Authorized()
    @Get('/trips')
    async getAllTrips(@CurrentUser() user: User) {
        const trip = await Trip.find({
            relations: ['events', 'events.images', 'members'],
            where: {
                user,
            },
        });
        if (!trip) {
            throw new NotFoundError('No trip were not found.');
        }
        return trip;
    }

    @Authorized()
    @Post('/trips')
    async createTrip(
        @CurrentUser()
        user: User,
        @Body() trip: Trip,
        @Res() response: any
    ) {
        try {
            const entity = Trip.create({
                ...trip,
                creator: user,
            });

            return entity.save();
        } catch (err) {
            console.log(err);
            response.status = 400;
            response.body = {
                message: 'Unable to create a new trip.',
            };
            return response;
        }
    }

    @Authorized()
    @Post('/trips/:id/member')
    async addMemberToTrip(
        @Param('id') id: number,
        @CurrentUser()
        user: User,
        @Res() response: any
    ) {
        try {
            const entity = await Trip.findOne(id, { relations: ['members'] });
            if (!entity) throw new NotFoundError('Cannot find trip.');

            return await Trip.merge(entity, {
                members: [...entity.members, user],
            }).save();
        } catch (err) {
            console.log(err);
            response.status = 400;
            response.body = {
                message: 'Unable to create a new trip.',
            };
            return response;
        }
    }

    @Authorized()
    @Put('/trips/:id')
    async updateTrip(
        @Param('id') id: number,
        @CurrentUser() user: User,
        @Body() update: Partial<Trip>
    ) {
        const entity = await Trip.findOne(id, { where: { user } });
        if (!entity) throw new NotFoundError('Cannot find trip.');
        return await Trip.merge(entity, update).save();
    }

    @Authorized()
    @Delete('/trips/:id')
    async deleteTrip(
        @Param('id') id: number,
        @CurrentUser() user: User,
        @Res() response: any
    ) {
        try {
            if ((await Trip.delete({ id, creator: user })).affected === 0) {
                throw new NotFoundError('Could not find trip to delete.');
            }
            response.body = {
                message: 'Successfully deleted the trip',
            };
            return response;
        } catch (err) {
            console.log(err);
            response.status = 404;
            response.body = {
                message: 'Could not find trip to delete.',
            };

            return response;
        }
    }
}
