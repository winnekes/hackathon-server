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

const fs = require('fs');
const multer = require('koa-multer');
const uuidv1 = require('uuid/v1');
const upload = multer({ dest: 'uploads/' });

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
        const path = `/media/simona/DATA/travelin-images/${fileName}`;
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
        if (exifResult.DateTimeOriginal) {
            image.createdAt = exifResult.DateTimeOriginal;
        } else if (exifResult.timestamp) {
            image.createdAt = exifResult.timestamp;
        }
        if (exifResult.latitude && exifResult.longitude) {
            image.latitude = exifResult.latitude;
            image.longitude = exifResult.longitude;
        }
        console.log(await image.save());
        ctx.type = 'application/json';
        response.status = 201;
        response.body = { url: image.url };
        return response;
    }

    @Get('/images/:fileName')
    async getImageFile(
        @Ctx() ctx: any,
        @Param('fileName') fileName: string,
        @Res() response: any
    ) {
        console.log(fileName);
        const path = `/media/simona/DATA/travelin-images/${fileName}`;
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
}
