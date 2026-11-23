export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: 'CLIENT' | 'ORGANIZER' | 'DOOR_STAFF';
}
