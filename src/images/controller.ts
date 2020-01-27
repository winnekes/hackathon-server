import {
    Authorized,
    Body,
    Ctx,
    CurrentUser,
    Delete,
    Get,
    JsonController,
    NotFoundError,
    Param,
    Post,
    Put,
    Res,
    UploadedFile,
    BadRequestError,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi/build/decorators';
import User from '../users/entity';
import Image from './entity';
import Event from '../events/entity';
import * as exifr from 'exifr';
import Trip from '../trips/entity';

const fs = require('fs');
const multer = require('koa-multer');
const uuidv1 = require('uuid/v1');
const upload = multer({ dest: 'uploads/' });
const PDFDocument = require('pdfkit');

@JsonController()
@OpenAPI({
    security: [{ bearerAuth: [] }],
})
export default class ImageController {
    @Authorized()
    @Post('/images/:eventId')
    async handleFileUpload(
        @Ctx() ctx: any,
        @UploadedFile('file') file: any,
        @CurrentUser() user: User,
        @Param('eventId') eventId: number,
        @Res() response: any
    ) {
        const fileName = uuidv1();
        const path = `./travelin-images/${fileName}`;
        const url = `/images/${fileName}`;
        await fs.writeFile(path, file.buffer, err => {
            if (err) {
                console.log('image upload failed:', err);
                response.status = 500;
                response.body = {
                    message: 'File upload failed.',
                };
                return;
            }
        });
        const image = Image.create();
        image.id = fileName;
        image.mimeType = file.mimetype;
        image.createdAt = new Date();
        const event = await Event.findOne(eventId);
        if (event) image.event = event;
        image.url = url;
        image.user = user;
        image.private = false;

        const exifResult = await exifr.parse(file.buffer);
        console.log('buf', file.buffer);
        console.log('exif', exifResult);
        if (exifResult) {
            if (exifResult.DateTimeOriginal) {
                image.createdAt = exifResult.DateTimeOriginal;
            } else if (exifResult.timestamp) {
                image.createdAt = exifResult.timestamp;
            }
            if (exifResult.latitude && exifResult.longitude) {
                image.latitude = exifResult.latitude;
                image.longitude = exifResult.longitude;
            }
        } else {
            image.createdAt = new Date();
            image.latitude = 52.3667;
            image.longitude = 4.8945;
        }
        console.log(await image.save());
        ctx.type = 'application/json';
        response.status = 201;
        response.body = { url: image.url, fileName };
        return response;
    }

    @Authorized()
    @Put('/images/:fileName')
    async updateImageFile(
        @Param('fileName') fileName: string,
        @CurrentUser() user: User,
        @Body() image: Partial<Image>,
        @Res() response: any
    ) {
        const entity = await Image.findOne(fileName, { where: { user } });
        if (entity) {
            return await Image.merge(entity, image).save();
        } else {
            response.status = 404;
            response.body = {
                message: `File ${fileName} does not exist`,
            };
            return response;
        }
    }
    @Get('/images/:fileName')
    async getImageFile(
        @Ctx() ctx: any,
        @Param('fileName') fileName: string,
        @Res() response: any
    ) {
        console.log(fileName);
        const path = `./travelin-images/${fileName}`;
        const image = await Image.findOne(fileName);
        if (!fs.existsSync(path) || !image) {
            response.status = 404;
            response.body = {
                message: `File ${fileName} does not exist`,
            };
            return response;
        } else {
            ctx.type = image.mimeType;
            response.body = fs.readFileSync(path);
        }
        return response;
    }

    @Authorized()
    @Get('/itinary/:id')
    async createPDF(@Param('id') tripId: number) {
        const doc = new PDFDocument();

        const fileName = `${uuidv1()}.pdf`;
        doc.pipe(fs.createWriteStream(fileName));

        const trip = await Trip.findOne(tripId, {
            relations: ['events'],
        });

        if (trip) {
            let itineraryText = `Your trip itinerary: ${trip.title}\n\n\n`; // \n is newline
            trip.events.forEach(event => {
                itineraryText =
                    itineraryText +
                    `\t${event.title}: ${event.startsAt} - ${event.endsAt}\n\t${event.note}\n\n`; // You might want to use momentjs for the dates
            });

            doc.font('fonts/PalatinoBold.ttf')
                .fontSize(25)
                .text(itineraryText, 100, 100); // Also this, what is the 100, 100?

            doc.end();
        }
    }

    @Authorized()
    @Delete('/images/:fileName')
    async deleteImage(
        @Param('fileName') fileName: string,
        @CurrentUser() user: User,
        @Res() response: any
    ) {
        try {
            if ((await Image.delete({ id: fileName, user })).affected === 0) {
                throw new NotFoundError('Could not find image to delete.');
            }
            response.body = {
                message: 'Successfully deleted the image',
            };
            return response;
        } catch (err) {
            console.log(err);
            response.status = 404;
            response.body = {
                message: 'Could not find image to delete.',
            };

            return response;
        }
    }
}
