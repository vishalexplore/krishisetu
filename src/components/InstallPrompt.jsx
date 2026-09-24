import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      // Chrome ka automatic mini-banner prevent karo
      event.preventDefault();

      // Event ko save karo
      setInstallEvent(event);

      // Apna custom popup dikhao
      setShow(true);

      console.log("KrishiSetu install prompt available");
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  async function installApp() {
    if (!installEvent) {
      console.log("Install prompt is not available yet.");
      return;
    }

    try {
      setInstalling(true);

      // IMPORTANT:
      // Native Chrome install prompt yahin open hoga
      await installEvent.prompt();

      const choice = await installEvent.userChoice;

      console.log(
        "KrishiSetu install result:",
        choice.outcome
      );

      if (choice.outcome === "accepted") {
        console.log("KrishiSetu installed successfully");
      }

      setInstallEvent(null);
      setShow(false);
    } catch (error) {
      console.error(
        "KrishiSetu installation failed:",
        error
      );
    } finally {
      setInstalling(false);
    }
  }

  function closePopup() {
    setShow(false);
  }

  if (!show || !installEvent) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] p-4 sm:bottom-5 sm:left-auto sm:right-5 sm:w-[380px]">
      <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-2xl">

        <div className="flex items-start gap-3">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <Smartphone size={23} />
          </div>

          <div className="min-w-0 flex-1">

            <div className="flex items-start justify-between gap-2">

              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Install KrishiSetu
                </h3>

                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  Install KrishiSetu on your phone for
                  quick access to your farming tools.
                </p>
              </div>

              <button
                type="button"
                onClick={closePopup}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={17} />
              </button>

            </div>

            <button
              type="button"
              onClick={installApp}
              disabled={installing}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={16} />

              {installing
                ? "Installing..."
                : "Install App"}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;