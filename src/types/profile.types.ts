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

/**
 * Default profile values
 */
export const DEFAULT_PROFILE: Profile = {
  email: "",
  contactEmail: "",
  displayName: "",
  photoUrl: "",
  emailVerified: false,
  credits: 0,
  selectedAvatar: "",
  selectedTalkingPhoto: "",
  useCredits: true,
};
