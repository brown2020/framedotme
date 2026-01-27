interface SignedInViewProps {
  displayName?: string;
  email?: string;
  onSignOut: () => void;
}

/**
 * View displayed when user is authenticated
 */
export function SignedInView({
  displayName,
  email,
  onSignOut,
}: SignedInViewProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-2xl text-center">You are signed in</div>
      <div className="input-disabled">{displayName}</div>
      <div className="input-disabled">{email}</div>
      <button onClick={onSignOut} className="btn-danger">
        Sign Out
      </button>
    </div>
  );
}
