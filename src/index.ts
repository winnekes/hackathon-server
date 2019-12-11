import 'reflect-metadata';
import { Action, createKoaServer } from 'routing-controllers';
import setupDb from './db';
import { verify } from './jwt';
import UserController from './users/controller';
import User from './users/entity';
import LoginController from './logins/controller';
import SpecController from './specs/controllers';
import TripController from './trips/controller';
import EventController from './events/controller';

const port = process.env.PORT;

const app = createKoaServer({
    cors: true,
    controllers: [
        UserController,
        LoginController,
        TripController,
        EventController,
        SpecController,
    ],
    authorizationChecker: (action: Action) => {
        console.log(action.request.headers);
        const header: string = action.request.headers.authorization;
        if (header && header.startsWith('Bearer ')) {
            const [, token] = header.split(' ');
            return !!(token && verify(token));
        }
        return false;
    },
    currentUserChecker: async (action: Action) => {
        const header: string = action.request.headers.authorization;
        if (header && header.startsWith('Bearer ')) {
            const [, token] = header.split(' ');

            return await User.findOne(verify(token).data);
        }
        return;
    },
});

setupDb()
    .then(_ => app.listen(port, () => console.log(`Listening on port ${port}`)))
    .catch(err => console.error(err));
