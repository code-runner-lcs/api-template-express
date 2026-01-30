import { Request, Response } from 'express';
import { MailController } from '../src/controller/MailController';
import { mailService } from '../src/services/MailService';
import * as dataSource from '../src/data-source';
import { UtilsAuthentication } from '../src/utils/auth.util';

// Mock dependencies
jest.mock('../src/services/MailService');
jest.mock('../src/data-source');
jest.mock('../src/utils/auth.util');

describe('MailController', () => {
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

  describe('sendEmail', () => {
    it('should return 400 if email is invalid', async () => {
      mockRequest.body = {
        to: 'invalid-email',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      };

      await MailController.sendEmail(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('should return 400 if subject is missing', async () => {
      mockRequest.body = {
        to: 'test@example.com',
        html: '<p>Test content</p>',
      };

      await MailController.sendEmail(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('should return 400 if html is missing', async () => {
      mockRequest.body = {
        to: 'test@example.com',
        subject: 'Test Subject',
      };

      await MailController.sendEmail(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('should return 200 when email is sent successfully', async () => {
      mockRequest.body = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      };

      (mailService.sendMail as jest.Mock).mockResolvedValue(true);

      await MailController.sendEmail(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Email sent successfully' });
      expect(mailService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: undefined,
      });
    });

    it('should accept array of email addresses', async () => {
      mockRequest.body = {
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      };

      (mailService.sendMail as jest.Mock).mockResolvedValue(true);

      await MailController.sendEmail(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mailService.sendMail).toHaveBeenCalledWith({
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: undefined,
      });
    });

    it('should accept optional text field', async () => {
      mockRequest.body = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: 'Test content',
      };

      (mailService.sendMail as jest.Mock).mockResolvedValue(true);

      await MailController.sendEmail(mockRequest as Request, mockResponse as Response);

      expect(mailService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: 'Test content',
      });
    });

    it('should return 500 when email sending fails', async () => {
      mockRequest.body = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      };

      (mailService.sendMail as jest.Mock).mockResolvedValue(false);

      await MailController.sendEmail(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to send email' });
    });

    it('should return 500 on server error', async () => {
      mockRequest.body = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      };

      (mailService.sendMail as jest.Mock).mockRejectedValue(new Error('SMTP error'));

      await MailController.sendEmail(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should return 400 if email is invalid', async () => {
      mockRequest.body = {
        to: 'invalid-email',
      };

      await MailController.sendPasswordResetEmail(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('should return 400 if user is not found', async () => {
      mockRequest.body = {
        to: 'test@example.com',
      };

      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      (dataSource.getRepo as jest.Mock).mockReturnValue(mockRepo);

      await MailController.sendPasswordResetEmail(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return 200 when password reset email is sent successfully', async () => {
      mockRequest.body = {
        to: 'test@example.com',
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'John Doe',
      };
      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(mockUser),
      };
      const mockToken = 'generated-token-123';

      (dataSource.getRepo as jest.Mock).mockReturnValue(mockRepo);
      (UtilsAuthentication.generateToken as jest.Mock).mockReturnValue(mockToken);
      (mailService.sendPasswordResetEmail as jest.Mock).mockResolvedValue(true);

      await MailController.sendPasswordResetEmail(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Password reset email sent successfully'
      });
      expect(UtilsAuthentication.generateToken).toHaveBeenCalledWith({
        email: 'test@example.com',
        id: 1,
      }, '1h');
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        mockToken
      );
    });

    it('should return 500 when password reset email sending fails', async () => {
      mockRequest.body = {
        to: 'test@example.com',
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'John Doe',
      };
      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(mockUser),
      };
      const mockToken = 'generated-token-123';

      (dataSource.getRepo as jest.Mock).mockReturnValue(mockRepo);
      (UtilsAuthentication.generateToken as jest.Mock).mockReturnValue(mockToken);
      (mailService.sendPasswordResetEmail as jest.Mock).mockResolvedValue(false);

      await MailController.sendPasswordResetEmail(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to send password reset email' });
    });

    it('should return 500 on server error', async () => {
      mockRequest.body = {
        to: 'test@example.com',
      };

      const mockRepo = {
        findOne: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      (dataSource.getRepo as jest.Mock).mockReturnValue(mockRepo);

      await MailController.sendPasswordResetEmail(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('sendConfirmationEmail', () => {
    it('should return 400 if email is invalid', async () => {
      mockRequest.body = {
        to: 'invalid-email',
        name: 'John Doe',
      };

      await MailController.sendConfirmationEmail(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('should return 400 if name is missing', async () => {
      mockRequest.body = {
        to: 'test@example.com',
      };

      await MailController.sendConfirmationEmail(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('should return 400 if user is not found', async () => {
      mockRequest.body = {
        to: 'test@example.com',
        name: 'John Doe',
      };

      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      (dataSource.getRepo as jest.Mock).mockReturnValue(mockRepo);

      await MailController.sendConfirmationEmail(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return 200 when confirmation email is sent successfully', async () => {
      mockRequest.body = {
        to: 'test@example.com',
        name: 'John Doe',
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'John Doe',
      };
      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(mockUser),
      };
      const mockToken = 'generated-token-123';

      (dataSource.getRepo as jest.Mock).mockReturnValue(mockRepo);
      (UtilsAuthentication.generateToken as jest.Mock).mockReturnValue(mockToken);
      (mailService.sendConfirmationEmail as jest.Mock).mockResolvedValue(true);

      await MailController.sendConfirmationEmail(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Confirmation email sent successfully' });
      expect(UtilsAuthentication.generateToken).toHaveBeenCalledWith({
        email: 'test@example.com',
        id: 1,
      }, '1h');
      expect(mailService.sendConfirmationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'John Doe',
        mockToken
      );
    });

    it('should return 500 when confirmation email sending fails', async () => {
      mockRequest.body = {
        to: 'test@example.com',
        name: 'John Doe',
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'John Doe',
      };
      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(mockUser),
      };
      const mockToken = 'generated-token-123';

      (dataSource.getRepo as jest.Mock).mockReturnValue(mockRepo);
      (UtilsAuthentication.generateToken as jest.Mock).mockReturnValue(mockToken);
      (mailService.sendConfirmationEmail as jest.Mock).mockResolvedValue(false);

      await MailController.sendConfirmationEmail(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to send confirmation email' });
    });

    it('should return 500 on server error', async () => {
      mockRequest.body = {
        to: 'test@example.com',
        name: 'John Doe',
      };

      const mockRepo = {
        findOne: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      (dataSource.getRepo as jest.Mock).mockReturnValue(mockRepo);

      await MailController.sendConfirmationEmail(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});
