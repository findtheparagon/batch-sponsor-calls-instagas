import { useEffect, useState } from "react";
import { createAppKit, useAppKitAccount } from "@reown/appkit/react";
import { WagmiProvider } from "wagmi";
import type { Capabilities } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ActionButtonList } from "./components/ActionButtonList";
import { InfoList } from "./components/InfoList";
import { projectId, metadata, networks, wagmiAdapter } from "./config";

import "./App.css";

const queryClient = new QueryClient();

const generalConfig = {
  projectId,
  networks,
  metadata,
  themeMode: "dark" as const,
  themeVariables: {
    "--w3m-accent": "#333"
  }
};

// Create modal
createAppKit({
  adapters: [wagmiAdapter],
  ...generalConfig,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  }
});

export function App() {
  const [transactionHash, setTransactionHash] = useState<
    `0x${string}` | undefined
  >(undefined);
  const [capabilities, setCapabilities] = useState<Capabilities | undefined>(
    undefined
  );
  const [error, setError] = useState("");
  const [status, setStatus] = useState<string | undefined>("");

  const account = useAppKitAccount();

  useEffect(() => {
    if (!account.isConnected) {
      setError("");
      setStatus("");
      setCapabilities(undefined);
      setTransactionHash(undefined);
    }
  }, [account]);

  const receiveHash = (hash: `0x${string}`) => {
    setTransactionHash(hash); // Update the state with the transaction hash
  };

  const receiveCapabilities = (capabilities: Capabilities) => {
    setCapabilities(capabilities);
  };

  const receiveError = (error: string) => {
    setError(error);
  };

  const receiveStatus = (status: string | undefined) => {
    setStatus(status);
  };

  return (
    <div className="w-full">
      <div className="flex h-[72px] items-center justify-between gap-8 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <svg
            width="154"
            height="24"
            viewBox="0 0 181 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clip-path="url(#clip0_3327_71745)">
              <path
                d="M61.3533 20.1503C59.8405 20.1482 58.3701 19.3643 57.5593 17.9635C56.7486 16.5629 56.8032 14.9009 57.5574 13.5931L57.5554 13.5913L57.353 13.4747L53.3526 20.3861H61.3533V20.153L61.3533 20.1503Z"
                fill="#FAFAFA"
              />
              <path
                d="M67.0174 10.3633C66.2593 9.05758 64.8434 8.17923 63.2219 8.17923C61.6005 8.17923 60.1848 9.05735 59.4266 10.3628L59.424 10.362L59.2215 10.2454L63.2219 3.33398L67.2223 10.2454L67.0198 10.362L67.0174 10.3633Z"
                fill="#FAFAFA"
              />
              <path
                d="M68.8861 13.5926C69.6406 14.9004 69.6953 16.5627 68.8845 17.9635C68.0738 19.3641 66.6036 20.148 65.091 20.1503L65.0904 20.153V20.3861H73.0911L69.0908 13.4747L68.8884 13.5913L68.8861 13.5926Z"
                fill="#FAFAFA"
              />
              <path
                d="M15.7102 9.07528C15.7102 5.79032 13.6191 4.25977 9.12881 4.25977H0V20.3846H3.06513V13.97H9.09552C13.6095 13.97 15.7112 12.4224 15.7112 9.09777V9.07528H15.7102ZM12.5548 9.13204C12.5548 11.3267 10.8536 11.6287 9.01497 11.6287H3.06513V6.63539H9.01605C10.2372 6.63539 11.0308 6.7832 11.5893 7.1163C12.2391 7.50402 12.5559 8.15523 12.5559 9.10955V9.13204H12.5548Z"
                fill="#FAFAFA"
              />
              <path
                d="M48.082 16.0727V20.388H51.1353V15.8338C51.1353 13.8545 50.2826 12.6003 48.5997 12.1065L48.3988 12.0476L48.5965 11.9791C50.1677 11.4328 50.9646 10.2472 50.9646 8.4542C50.9646 5.5559 49.0228 4.26312 44.6679 4.26312H35.6529V20.388H38.7288V13.349H44.8837C47.095 13.349 48.082 14.1887 48.082 16.0727ZM38.7288 10.9851V6.67301H44.3951C46.586 6.67301 47.8543 7.0254 47.8543 8.82907C47.8543 10.7238 46.3561 10.9851 44.7366 10.9851H38.7288Z"
                fill="#FAFAFA"
              />
              <path
                d="M128.917 20.3869V4.26312H126.012V16.725L117.686 4.26312H113.621V20.3869H116.526V7.55236L125.147 20.3869H128.917Z"
                fill="#FAFAFA"
              />
              <path
                d="M72.8123 12.4126C72.8123 14.8782 73.6006 16.9529 75.0913 18.4117C76.5991 19.8876 78.7632 20.6673 81.3504 20.6673C84.3092 20.6673 86.4067 19.6884 87.5838 17.7583L87.7073 17.5559L87.718 20.406H90.3321V11.605H81.2215V13.8104H87.4785L87.471 13.8843C87.2036 16.5694 84.9944 18.3046 81.8423 18.3046C78.267 18.3046 75.9558 15.9836 75.9558 12.3901V12.3334C75.9558 8.69282 78.2305 6.43073 81.8928 6.43073C84.5004 6.43073 86.4368 7.63139 87.0833 9.64392H90.2365C89.6286 6.22509 86.3197 4.02191 81.78 4.02191C76.1642 4.02191 72.8112 7.13763 72.8112 12.3569V12.4137L72.8123 12.4126Z"
                fill="#FAFAFA"
              />
              <path
                d="M108.579 6.28449C106.995 4.80107 104.73 4.01812 102.029 4.01812C99.3278 4.01812 97.0628 4.80214 95.4787 6.28449C93.9085 7.75399 93.0794 9.84042 93.0794 12.3178V12.3628C93.0794 14.8573 93.8903 16.9437 95.4239 18.3972C96.9887 19.8795 99.273 20.6635 102.029 20.6635C104.785 20.6635 107.069 19.8795 108.634 18.3972C110.167 16.9437 110.978 14.8573 110.978 12.3628V12.3178C110.978 9.84042 110.148 7.75399 108.579 6.28449ZM107.811 12.3639C107.811 14.0861 107.333 15.5299 106.43 16.5399C105.425 17.6635 103.944 18.2322 102.029 18.2322C100.114 18.2322 98.6329 17.6624 97.6277 16.5399C96.7245 15.5299 96.2466 14.0861 96.2466 12.3639V12.3189C96.2466 8.64404 98.4085 6.4505 102.029 6.4505C105.649 6.4505 107.811 8.64404 107.811 12.3189V12.3639Z"
                fill="#FAFAFA"
              />
              <path
                d="M28.3862 16.4903L30.3097 20.3846H33.6305L25.4113 4.25977H22.4224L14.214 20.3846H17.3876L19.3122 16.4903H28.3862ZM23.8594 7.29088L27.2328 14.1371H20.4753L23.8594 7.29088Z"
                fill="#FAFAFA"
              />
            </g>
            <rect
              x="138"
              y="0.5"
              width="43"
              height="23"
              rx="8"
              fill="#2C4DFF"
            />
            <path
              d="M146.632 15.5V8.22727H149.544C150.079 8.22727 150.525 8.30658 150.883 8.4652C151.24 8.62382 151.509 8.84399 151.689 9.12571C151.869 9.40507 151.959 9.72704 151.959 10.0916C151.959 10.3757 151.902 10.6255 151.788 10.8409C151.675 11.054 151.518 11.2292 151.32 11.3665C151.123 11.5014 150.898 11.5973 150.645 11.6541V11.7251C150.922 11.737 151.181 11.8151 151.423 11.9595C151.666 12.1039 151.864 12.3063 152.016 12.5668C152.167 12.8248 152.243 13.1326 152.243 13.4901C152.243 13.8759 152.147 14.2204 151.955 14.5234C151.766 14.8241 151.485 15.062 151.114 15.2372C150.742 15.4124 150.284 15.5 149.739 15.5H146.632ZM148.17 14.2429H149.423C149.852 14.2429 150.164 14.1612 150.361 13.9979C150.557 13.8322 150.656 13.612 150.656 13.3374C150.656 13.1361 150.607 12.9586 150.51 12.8047C150.413 12.6508 150.274 12.5301 150.094 12.4425C149.917 12.3549 149.705 12.3111 149.459 12.3111H148.17V14.2429ZM148.17 11.2706H149.31C149.52 11.2706 149.707 11.2339 149.871 11.1605C150.036 11.0848 150.167 10.9782 150.261 10.8409C150.358 10.7036 150.407 10.5391 150.407 10.3473C150.407 10.0845 150.313 9.87263 150.126 9.71165C149.942 9.55066 149.679 9.47017 149.338 9.47017H148.17V11.2706ZM153.443 15.5V8.22727H158.344V9.49503H154.981V11.228H158.092V12.4957H154.981V14.2322H158.358V15.5H153.443ZM159.489 9.49503V8.22727H165.463V9.49503H163.236V15.5L161.716 15.5V9.49503H159.489ZM167.011 15.5H165.363L167.874 8.22727H169.856L172.363 15.5H170.715L168.893 9.88921H168.836L167.011 15.5ZM166.908 12.6413H170.8V13.8416H166.908V12.6413Z"
              fill="#FAFAFA"
            />
            <defs>
              <clipPath id="clip0_3327_71745">
                <rect
                  width="130"
                  height="17.3333"
                  fill="white"
                  transform="translate(0 3.33398)"
                />
              </clipPath>
            </defs>
          </svg>
        </div>
        <div className="font-bold uppercase">Multiwrap</div>
        <div className="justify-end">LOGIN</div>
      </div>

      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <div className="flex flex-col justify-center items-center">
            <appkit-button />
            <ActionButtonList
              sendHash={receiveHash}
              sendCapabilities={receiveCapabilities}
              sendError={receiveError}
              sendStatus={receiveStatus}
            />
          </div>
          <div className="advice">
            <p>
              See console for logging and errors
              <br />
              Go to{" "}
              <a
                href="https://dashboard.candide.dev/"
                target="_blank"
                className="link-button"
                rel="Candide Dashboard"
              >
                Candide Dashboard
              </a>{" "}
              to get setup a gas policy.
            </p>
          </div>
          <InfoList
            hash={transactionHash}
            capabilities={capabilities}
            error={error}
            status={status}
          />
        </QueryClientProvider>
      </WagmiProvider>
    </div>
  );
}

export default App;
