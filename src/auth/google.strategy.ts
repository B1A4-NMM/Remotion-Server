// google.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {

  constructor(configService: ConfigService) {
    // @ts-ignore
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_REDIRECT_URI'),
      scope: ['profile', 'email'],
      passReqToCallback: true,
    });
  }

  async validate(req:any, accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, id, displayName } = profile;
    const user = {
      id : id,
      email: emails[0].value,
      name: displayName,
      provider: 'google',
      state: req.query.state,
    };
    done(null, user);
  }
}
