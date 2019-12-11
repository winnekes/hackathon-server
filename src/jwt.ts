import * as jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'i love robots';
const ttl = 3600 * 4;

interface JwtPayload {
    id: number;
}

export const sign = (data: JwtPayload) =>
    jwt.sign({ data }, secret, { expiresIn: ttl });

export const verify = (token: string): { data: JwtPayload } =>
    jwt.verify(token, secret) as { data: JwtPayload };
