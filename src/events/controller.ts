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
import Event from './entity';
import Trip from '../trips/entity';

@JsonController()
@OpenAPI({
    security: [{ bearerAuth: [] }],
})
export default class EventController {
    @Authorized()
    @Post('/trips/:id/events')
    async createEvent(
        @Param('id') id: number,
        @CurrentUser()
        user: User,
        @Body() event: Event,
        @Res() response: any
    ) {
        console.log('HELLO');
        try {
            const trip = await Trip.findOne(id);

            if (trip) {
                const entity = Event.create({
                    ...event,
                    user,
                    trip,
                });
                console.log(entity);
                return await entity.save();
            } else
                throw new NotFoundError('Cannot find the trip for this event');
        } catch (err) {
            console.log(err);
            response.status = 400;
            response.body = {
                message: 'Unable to create a new event.',
            };
            return response;
        }
    }

    @Get('/trips/:id/slides')
    async getSlides(@Param('id') tripId: number, @Res() response: any) {
        const trip = await Trip.findOne(tripId, { where: { private: false } });
        if (!trip) {
            response.status = 404;
            response.body = {
                message: 'Trip not found or private',
            };
            return;
        }
        const events = await Event.find({
            where: { trip },
            relations: ['images'],
        });
        if (!events || events.length === 0) {
            return;
        }

        response.body = {
            tripName: trip.title,
            tripStart: trip.startsAt,
            tripEnd: trip.endsAt,
            slides: events
                .flatMap(event =>
                    event.images.map(image => {
                        return {
                            title: event.title,
                            url: image.url,
                            lat: image.latitude,
                            long: image.longitude,
                            note: image.note,
                            date: image.createdAt,
                            eventStart: event.startsAt,
                            eventEnd: event.endsAt,
                            private: image.private,
                        };
                    })
                )
                .filter(slide => !slide.private),
        };

        console.log(response);
        return response;
    }

    @Authorized()
    @Put('/events/:id')
    async updateEvent(
        @Param('id') id: number,
        @CurrentUser() user: User,
        @Body() update: Partial<Event>
    ) {
        const entity = await Event.findOne(id, { where: { user } });
        if (!entity) throw new NotFoundError('Cannot find event.');
        return await Event.merge(entity, update).save();
    }

    @Authorized()
    @Delete('/events/:id')
    async deleteEvent(
        @Param('id') id: number,
        @CurrentUser() user: User,
        @Res() response: any
    ) {
        try {
            if ((await Event.delete({ id, user })).affected === 0) {
                throw new NotFoundError('Could not find event to delete.');
            }
            response.body = {
                message: 'Successfully deleted the event',
            };
            return response;
        } catch (err) {
            console.log(err);
            response.status = 404;
            response.body = {
                message: 'Could not find event to delete.',
            };

            return response;
        }
    }
}
