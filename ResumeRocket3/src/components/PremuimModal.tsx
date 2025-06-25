import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
}

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const price = 49.99;

  useEffect(() => {
    // Only run if PayPal isn't already loaded
    if (typeof window !== "undefined" && !window.paypal) {
      const script = document.createElement("script");
      script.src = "https://www.paypal.com/sdk/js?client-id=BAAP2WHNZkL82bsMvM_5LuvOVvdVdoUELK20DBrEoUrViTiN41uiYT881kg43nhSN50wsayh-FpPmUDl7A&components=hosted-buttons&enable-funding=venmo&currency=USD";
      script.async = true;
      script.onload = () => {
        if (window.paypal) {
          window.paypal.HostedButtons({
            hostedButtonId: "NCAWHR9E5S5U2" // Replace with your actual hosted button ID
          }).render("#paypal-container");
        }
      };
      document.body.appendChild(script);
    } else if (window.paypal) {
      window.paypal.HostedButtons({
        hostedButtonId: "NCAWHR9E5S5U2"
      }).render("#paypal-container");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Purchase Access
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">${price}</div>
            <div className="mb-4 text-gray-600">One-time payment for full access</div>
            <div className="flex justify-center">
              <div id="paypal-container" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}