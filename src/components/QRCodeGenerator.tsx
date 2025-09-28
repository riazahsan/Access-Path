import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { RouteResponse } from '@/types';

interface QRCodeGeneratorProps {
  routeResponse: RouteResponse | null;
  plannedRoute: {
    start: [number, number];
    end: [number, number];
    startName: string;
    endName: string;
  } | null;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ routeResponse, plannedRoute }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const generateQRCode = () => {
    if (!routeResponse || !plannedRoute) {
      return null;
    }

    // Create route data for mobile app
    const routeData = {
      waypoints: [
        { lat: plannedRoute.start[1], lng: plannedRoute.start[0], name: plannedRoute.startName },
        { lat: plannedRoute.end[1], lng: plannedRoute.end[0], name: plannedRoute.endName }
      ],
      distance: routeResponse.route.distance,
      duration: routeResponse.route.duration,
      instructions: routeResponse.route.instructions,
      currentWaypoint: 0
    };

    // Determine the base URL for mobile app
    // Use ngrok URL if available, otherwise use local network IP
    const baseUrl = 'https://unhealthier-unafraid-gauge.ngrok-free.dev';
    const mobileUrl = `${baseUrl}/mobile/?route=${encodeURIComponent(JSON.stringify(routeData))}`;

    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-white rounded-lg">
          <QRCodeSVG 
            value={mobileUrl}
            size={256}
            level="M"
            includeMargin={true}
          />
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Scan this QR code with your phone to open AR navigation
          </p>
          <div className="flex flex-col space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(mobileUrl);
                // You could add a toast notification here
              }}
            >
              Copy Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'AR Navigation Route',
                    text: `Navigate from ${plannedRoute.startName} to ${plannedRoute.endName}`,
                    url: mobileUrl
                  });
                }
              }}
            >
              Share
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (!routeResponse || !plannedRoute) {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => setIsDialogOpen(true)}
        >
          <QrCode className="h-4 w-4" />
          Generate QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>AR Navigation QR Code</DialogTitle>
        </DialogHeader>
        {generateQRCode()}
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeGenerator;