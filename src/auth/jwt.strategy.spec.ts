import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { UserRepository } from './user.repository';
import { User } from './user.entity';
import { JwtPayload } from './jwt-payload.interface';
import MockFactory from '../test/mock.factory';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let userRepository: UserRepository;

  const mockUserRepository = () => ({
    findOne: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UserRepository, useFactory: mockUserRepository },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get<UserRepository>(UserRepository);
  });
  describe('registerNewUser', () => {
    const user: User = MockFactory.user();

    const jwtPayload: JwtPayload = {
      id: user.id,
      username: user.username,
    };

    describe('when user exists, based on JWT payload', () => {
      beforeEach(() => {
        userRepository.findOne = jest.fn().mockResolvedValue(user);
      });

      it('calls userRepository.findOne() with jwtPayload.id', async () => {
        await jwtStrategy.validate(jwtPayload);

        expect(userRepository.findOne).toHaveBeenCalledWith({
          id: jwtPayload.id,
        });
      });

      it('returns the user based on jwtPayload.id', async () => {
        const result: User = await jwtStrategy.validate(jwtPayload);

        expect(result).toEqual(user);
      });
    });

    it('when user cannot be found, throws an unauthorized exception', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(jwtStrategy.validate(jwtPayload)).rejects.toThrow(
        new UnauthorizedException(),
      );
    });
  });
});
