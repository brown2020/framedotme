/**
 * User profile type definition
 */
export interface Profile {
  email: string;
  contactEmail: string;
  displayName: string;
  photoUrl: string;
  emailVerified: boolean;
  credits: number;
  selectedAvatar: string;
  selectedTalkingPhoto: string;
  useCredits: boolean;
}
