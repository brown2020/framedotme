import { PulseLoader } from "react-spinners";

interface PendingSignInViewProps {
  email: string;
  onStartOver: () => void;
}

/**
 * View displayed while waiting for email link sign-in
 */
export function PendingSignInView({
  email,
  onStartOver,
}: PendingSignInViewProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-2xl text-center">Signing you in</div>
      <div className="flex flex-col gap-3 border rounded-md px-3 py-2">
        <div>
          {`Check your email at ${email} for a message from Frame.me`}
        </div>
        <div>{`If you don't see the message, check your spam folder. Mark it "not spam" or move it to your inbox.`}</div>
        <div>
          Click the sign-in link in the message to complete the sign-in
          process.
        </div>
        <div>
          Waiting for you to click the sign-in link.{" "}
          <span>
            {" "}
            <PulseLoader color="#000000" size={6} />
          </span>
        </div>
      </div>

      <button onClick={onStartOver} className="btn-danger">
        Start Over
      </button>
    </div>
  );
}
