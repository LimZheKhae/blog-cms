'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ImageIcon, Link, ExternalLink, AlertCircle } from 'lucide-react';

interface ImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (src: string, alt?: string) => void;
}

const ImageDialog = ({ isOpen, onClose, onInsert }: ImageDialogProps) => {
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(true);

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return url.match(/\.(jpeg|jpg|gif|png|svg|webp)$/i) !== null;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    setIsValidUrl(url === '' || validateUrl(url));
  };

  const handleInsert = () => {
    if (imageUrl && isValidUrl) {
      onInsert(imageUrl, altText || 'Image');
      handleClose();
    }
  };

  const handleClose = () => {
    setImageUrl('');
    setAltText('');
    setIsValidUrl(true);
    onClose();
  };

  const suggestedSources = [
    { name: 'Unsplash', url: 'https://unsplash.com', description: 'High-quality free photos' },
    { name: 'Pexels', url: 'https://pexels.com', description: 'Free stock photos & videos' },
    { name: 'Pixabay', url: 'https://pixabay.com', description: 'Free images & illustrations' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ImageIcon className="h-5 w-5 text-blue-600" />
            <span>Insert Image</span>
          </DialogTitle>
          <DialogDescription>
            Add an image to your post using a URL from external sources
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image URL Input */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="text-sm font-medium">
              Image URL *
            </Label>
            <div className="relative">
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className={`pr-10 ${!isValidUrl ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              <Link className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {!isValidUrl && (
              <div className="flex items-center space-x-1 text-red-600 text-xs">
                <AlertCircle className="h-3 w-3" />
                <span>Please enter a valid image URL (jpg, png, gif, svg, webp)</span>
              </div>
            )}
          </div>

          {/* Alt Text Input */}
          <div className="space-y-2">
            <Label htmlFor="altText" className="text-sm font-medium">
              Alt Text (Optional)
            </Label>
            <Input
              id="altText"
              type="text"
              placeholder="Describe the image for accessibility"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Helps screen readers and improves SEO
            </p>
          </div>

          {/* Image Preview */}
          {imageUrl && isValidUrl && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview</Label>
              <Card className="p-4">
                <CardContent className="p-0">
                  <img
                    src={imageUrl}
                    alt={altText || 'Preview'}
                    className="max-w-full h-auto max-h-48 rounded-lg shadow-sm mx-auto"
                    onError={() => setIsValidUrl(false)}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Suggested Sources */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Suggested Free Image Sources</Label>
            <div className="grid grid-cols-1 gap-2">
              {suggestedSources.map((source) => (
                <Card key={source.name} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{source.name}</h4>
                      <p className="text-xs text-gray-500">{source.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(source.url, '_blank')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleInsert} 
            disabled={!imageUrl || !isValidUrl}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Insert Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageDialog; 