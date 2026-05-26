import {
  errorCodigo6,
  errorDni8,
  errorEmailHistoriaUsuario,
  errorEmailSoloGmail,
  errorPasswordHistoria,
  errorPasswordSmtpApp,
  errorTelefono9,
} from './form-validators';

describe('form-validators', () => {
  describe('errorEmailHistoriaUsuario', () => {
    it('returns blank message for empty email', () => {
      const result = errorEmailHistoriaUsuario('   ');

      expect(result).toBe('El correo no puede estar en blanco.');
    });

    it('returns message when @ is missing', () => {
      const result = errorEmailHistoriaUsuario('correo.gmail.com');

      expect(result).toBe('El correo debe incluir el símbolo @.');
    });

    it('returns message for disallowed domain', () => {
      const result = errorEmailHistoriaUsuario('user@proton.me');

      expect(result).toContain('Solo se permiten dominios');
    });

    it('returns null for allowed domain', () => {
      const result = errorEmailHistoriaUsuario('user@gmail.com');

      expect(result).toBeNull();
    });
  });

  describe('errorEmailSoloGmail', () => {
    it('returns blank message for empty email', () => {
      const result = errorEmailSoloGmail('');

      expect(result).toBe('El correo no puede estar en blanco.');
    });

    it('returns message when not gmail.com', () => {
      const result = errorEmailSoloGmail('user@outlook.com');

      expect(result).toBe('Debe ser una cuenta @gmail.com.');
    });

    it('returns null for gmail.com', () => {
      const result = errorEmailSoloGmail('user@gmail.com');

      expect(result).toBeNull();
    });
  });

  describe('errorTelefono9', () => {
    it('returns blank message for empty digits', () => {
      const result = errorTelefono9('');

      expect(result).toBe('El teléfono no puede estar en blanco.');
    });

    it('returns message when length is not 9', () => {
      const result = errorTelefono9('91234');

      expect(result).toBe('El teléfono debe tener exactamente 9 dígitos numéricos.');
    });

    it('returns message when not starting with 9', () => {
      const result = errorTelefono9('812345678');

      expect(result).toBe('El teléfono debe empezar con 9.');
    });

    it('returns null for valid phone', () => {
      const result = errorTelefono9('912345678');

      expect(result).toBeNull();
    });
  });

  describe('errorDni8', () => {
    it('returns blank message for empty digits', () => {
      const result = errorDni8('');

      expect(result).toBe('El DNI no puede estar en blanco.');
    });

    it('returns message when length is not 8', () => {
      const result = errorDni8('1234567');

      expect(result).toBe('El DNI debe tener exactamente 8 dígitos numéricos.');
    });

    it('returns null for 8 digits', () => {
      const result = errorDni8('12345678');

      expect(result).toBeNull();
    });
  });

  describe('errorCodigo6', () => {
    it('returns blank message for empty code', () => {
      const result = errorCodigo6('   ');

      expect(result).toBe('El código no puede estar en blanco.');
    });

    it('returns message when length is not 6', () => {
      const result = errorCodigo6('12345');

      expect(result).toBe('El código debe tener exactamente 6 dígitos numéricos.');
    });

    it('returns null for 6 digits', () => {
      const result = errorCodigo6('123456');

      expect(result).toBeNull();
    });
  });

  describe('errorPasswordHistoria', () => {
    it('returns message when password does not meet regex', () => {
      const result = errorPasswordHistoria('abc', 'abc', '', '');

      expect(result).toContain('La clave requiere');
    });

    it('returns message when password contains nombre', () => {
      const result = errorPasswordHistoria('JuanP@ss1', 'JuanP@ss1', 'juan', '');

      expect(result).toBe('La clave no puede contener tu nombre.');
    });

    it('returns message when passwords do not match', () => {
      const result = errorPasswordHistoria('Abcdef1@', 'Abcdef2@', '', '');

      expect(result).toBe('Las contraseñas no coinciden.');
    });

    it('returns null for valid password', () => {
      const result = errorPasswordHistoria('Abcdef1@', 'Abcdef1@', '', '');

      expect(result).toBeNull();
    });
  });

  describe('errorPasswordSmtpApp', () => {
    it('returns message for empty password', () => {
      const result = errorPasswordSmtpApp('   ');

      expect(result).toBe('La contraseña de aplicación no puede estar vacía.');
    });

    it('returns message when shorter than 16 characters', () => {
      const result = errorPasswordSmtpApp('short');

      expect(result).toBe('La contraseña de aplicación debe tener al menos 16 caracteres.');
    });

    it('returns null for 16+ characters', () => {
      const result = errorPasswordSmtpApp('abcdefghijklmnop');

      expect(result).toBeNull();
    });
  });
});
