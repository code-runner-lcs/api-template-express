import { Request, Response } from 'express';
import { AuthController } from '../src/controller/Auth';
import { UtilsAuthentication } from '../src/utils/auth.util';
import * as dataSource from '../src/data-source';
import { mailService } from '../src/services/MailService';

// Mock dependencies
jest.mock('../src/data-source');
jest.mock('../src/utils/auth.util');
jest.mock('../src/services/MailService');

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
    mockRequest = {
      body: {},
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return 400 if email is invalid', async () => {
      mockRequest.body = { email: 'invalid-email', password: 'password123' };

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('should return 400 if password is too short', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'short' };

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('should return 401 if user is not found', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'password123' };

      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      (dataSource.getRepo as jest.Mock).mockReturnValue(mockRepo);

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should return 401 if password is incorrect', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'password123' };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
      };
      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(mockUser),
      };
      (dataSource.getRepo as jest.Mock).mockReturnValue(mockRepo);
      (UtilsAuthentication.check as jest.Mock).mockResolvedValue(false);

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should return 200 with token if credentials are valid', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'password123' };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'John Doe',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        getUserWithoutPassword: jest.fn().mockReturnValue({
          id: 1,
          email: 'test@example.com',
          name: 'John Doe',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        }),
      };
      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(mockUser),
      };
      const mockToken = 'jwt-token-123';

      (dataSource.getRepo as jest.Mock).mockReturnValue(mockRepo);
      (UtilsAuthentication.check as jest.Mock).mockResolvedValue(true);
      (UtilsAuthentication.generateToken as jest.Mock).mockReturnValue(mockToken);

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        user: mockUser.getUserWithoutPassword(),
        token: mockToken,
      });
      expect(UtilsAuthentication.generateToken).toHaveBeenCalledWith({
        email: mockUser.email,
        id: mockUser.id,
      });
    });

    it('should return 500 on server error', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'password123' };

      const mockRepo = {
        findOne: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      (dataSource.getRepo as jest.Mock).mockReturnValue(mockRepo);

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('register', () => {
    it('should return 400 if name is missing', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('should return 400 if email is invalid', async () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
      };

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('should return 400 if password is too short', async () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'short',
      };

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('should return 200 with user, token and mailErrors on successful registration', async () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'test@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        getUserWithoutPassword: jest.fn().mockReturnValue({
          id: 1,
          name: 'John Doe',
          email: 'test@example.com',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        }),
      };
      const mockToken = 'jwt-token-123';
      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue(mockUser),
        save: jest.fn().mockResolvedValue(mockUser),
      };

      (dataSource.getRepo as jest.Mock).mockReturnValue(mockRepo);
      (UtilsAuthentication.hash as jest.Mock).mockResolvedValue('hashedpassword');
      (UtilsAuthentication.generateToken as jest.Mock).mockReturnValue(mockToken);
      (mailService.sendWelcomeEmail as jest.Mock).mockResolvedValue(true);
      (mailService.sendConfirmationEmail as jest.Mock).mockResolvedValue(true);

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        user: mockUser.getUserWithoutPassword(),
        token: mockToken,
        mailErrors: [],
      });
      expect(UtilsAuthentication.hash).toHaveBeenCalledWith('password123');
      expect(mockRepo.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'hashedpassword',
      });
      expect(mockRepo.save).toHaveBeenCalledWith(mockUser);
    });

    it('should return 400 if user already exists', async () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
      };

      const existingUser = {
        id: 1,
        name: 'John Doe',
        email: 'test@example.com',
        password: 'hashedpassword',
      };
      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(existingUser),
      };

      (dataSource.getRepo as jest.Mock).mockReturnValue(mockRepo);

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User already exists' });
    });

    it('should return 500 on server error', async () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
      };

      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(() => {
          throw new Error('Database error');
        }),
      };

      (dataSource.getRepo as jest.Mock).mockReturnValue(mockRepo);
      (UtilsAuthentication.hash as jest.Mock).mockResolvedValue('hashedpassword');

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('me', () => {
    it('should return 200 with user data from res.locals.user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'John Doe',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockResponse.locals = { user: mockUser };

      await AuthController.me(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should return 200 with empty object if no user in res.locals', async () => {
      mockResponse.locals = { user: undefined };

      await AuthController.me(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({});
    });
  });
});

describe('UtilsAuthentication', () => {
  // Restore real implementations for these tests
  beforeAll(() => {
    jest.unmock('../src/utils/auth.util');
  });

  describe('hash and check', () => {
    it('should hash a password and verify it correctly', async () => {
      // Real import for these tests
      const { UtilsAuthentication: RealAuth } = jest.requireActual('../src/utils/auth.util');

      const password = 'testPassword123';
      const hashedPassword = await RealAuth.hash(password);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toHaveLength(60); // bcrypt hash length

      const isValid = await RealAuth.check(password, hashedPassword);
      expect(isValid).toBe(true);

      const isInvalid = await RealAuth.check('wrongPassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });
  });

  describe('generateToken and checkToken', () => {
    it('should generate and verify a JWT token', () => {
      const { UtilsAuthentication: RealAuth } = jest.requireActual('../src/utils/auth.util');

      // Ensure the secret is defined
      RealAuth.secret = 'test-secret-key';

      const userData = { email: 'test@example.com', id: 1 };
      const token = RealAuth.generateToken(userData);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      const decoded = RealAuth.checkToken(token) as any;
      expect(decoded.email).toBe(userData.email);
      expect(decoded.id).toBe(userData.id);
    });

    it('should return false for an invalid token', () => {
      const { UtilsAuthentication: RealAuth } = jest.requireActual('../src/utils/auth.util');
      RealAuth.secret = 'test-secret-key';

      const result = RealAuth.checkToken('invalid-token');
      expect(result).toBe(false);
    });
  });

  describe('getBearerToken', () => {
    it('should extract the token from Authorization header', () => {
      const { UtilsAuthentication: RealAuth } = jest.requireActual('../src/utils/auth.util');

      const mockReq = {
        headers: {
          authorization: 'Bearer my-jwt-token',
        },
      } as any;

      const token = RealAuth.getBearerToken(mockReq);
      expect(token).toBe('my-jwt-token');
    });

    it('should return an empty string if no Authorization header', () => {
      const { UtilsAuthentication: RealAuth } = jest.requireActual('../src/utils/auth.util');

      const mockReq = {
        headers: {},
      } as any;

      const token = RealAuth.getBearerToken(mockReq);
      expect(token).toBe('');
    });
  });
});
