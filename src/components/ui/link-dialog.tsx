'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LinkIcon, ExternalLink, AlertCircle, Check } from 'lucide-react';

interface LinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, text?: string) => void;
  initialUrl?: string;
  initialText?: string;
}

const LinkDialog = ({ isOpen, onClose, onInsert, initialUrl = '', initialText = '' }: LinkDialogProps) => {
  const [linkUrl, setLinkUrl] = useState(initialUrl);
  const [linkText, setLinkText] = useState(initialText);
  const [isValidUrl, setIsValidUrl] = useState(true);

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (url: string) => {
    setLinkUrl(url);
    setIsValidUrl(url === '' || validateUrl(url));
  };

  const handleInsert = () => {
    if (linkUrl && isValidUrl) {
      onInsert(linkUrl, linkText || linkUrl);
      handleClose();
    }
  };

  const handleClose = () => {
    setLinkUrl(initialUrl);
    setLinkText(initialText);
    setIsValidUrl(true);
    onClose();
  };

  const handleRemoveLink = () => {
    onInsert('', '');
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <LinkIcon className="h-5 w-5 text-blue-600" />
            <span>{initialUrl ? 'Edit Link' : 'Insert Link'}</span>
          </DialogTitle>
          <DialogDescription>
            Add or edit a hyperlink in your content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Link URL Input */}
          <div className="space-y-2">
            <Label htmlFor="linkUrl" className="text-sm font-medium">
              URL *
            </Label>
            <div className="relative">
              <Input
                id="linkUrl"
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className={`pr-10 ${!isValidUrl ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {!isValidUrl && (
              <div className="flex items-center space-x-1 text-red-600 text-xs">
                <AlertCircle className="h-3 w-3" />
                <span>Please enter a valid URL</span>
              </div>
            )}
            {isValidUrl && linkUrl && (
              <div className="flex items-center space-x-1 text-green-600 text-xs">
                <Check className="h-3 w-3" />
                <span>Valid URL format</span>
              </div>
            )}
          </div>

          {/* Link Text Input */}
          <div className="space-y-2">
            <Label htmlFor="linkText" className="text-sm font-medium">
              Link Text (Optional)
            </Label>
            <Input
              id="linkText"
              type="text"
              placeholder="Click here to visit..."
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              The text that will be displayed as the link. If empty, the URL will be used.
            </p>
          </div>

          {/* Link Preview */}
          {linkUrl && isValidUrl && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-blue-600 underline cursor-pointer hover:text-blue-800">
                  {linkText || linkUrl}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {initialUrl && (
              <Button variant="outline" onClick={handleRemoveLink} className="text-red-600 hover:text-red-700">
                Remove Link
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleInsert} 
              disabled={!linkUrl || !isValidUrl}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {initialUrl ? 'Update Link' : 'Insert Link'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LinkDialog; 