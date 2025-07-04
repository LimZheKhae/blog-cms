'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { VideoIcon, Link, ExternalLink, AlertCircle, Play } from 'lucide-react';

interface VideoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (src: string, title?: string) => void;
}

const VideoDialog = ({ isOpen, onClose, onInsert }: VideoDialogProps) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [embedUrl, setEmbedUrl] = useState('');

  const getEmbedUrl = (url: string) => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/)([0-9]+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // Direct video files
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return url;
    }

    return '';
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      const embed = getEmbedUrl(url);
      return embed !== '';
    } catch {
      return false;
    }
  };

  const handleUrlChange = (url: string) => {
    setVideoUrl(url);
    const isValid = url === '' || validateUrl(url);
    setIsValidUrl(isValid);
    
    if (isValid && url) {
      setEmbedUrl(getEmbedUrl(url));
    } else {
      setEmbedUrl('');
    }
  };

  const handleInsert = () => {
    if (videoUrl && isValidUrl) {
      onInsert(embedUrl, videoTitle || 'Video');
      handleClose();
    }
  };

  const handleClose = () => {
    setVideoUrl('');
    setVideoTitle('');
    setIsValidUrl(true);
    setEmbedUrl('');
    onClose();
  };

  const suggestedSources = [
    { name: 'YouTube', url: 'https://youtube.com', description: 'World\'s largest video platform' },
    { name: 'Vimeo', url: 'https://vimeo.com', description: 'High-quality video hosting' },
    { name: 'Direct Files', url: '#', description: 'MP4, WebM, OGG video files' },
  ];

  const getVideoType = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('vimeo.com')) return 'Vimeo';
    if (url.match(/\.(mp4|webm|ogg)$/i)) return 'Direct Video';
    return 'Unknown';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-2">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <VideoIcon className="h-5 w-5 text-purple-600" />
            <span>Insert Video</span>
          </DialogTitle>
          <DialogDescription>
            Add a video to your post using a URL from YouTube, Vimeo, or direct video files
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[80vh]">
          {/* Video URL Input */}
          <div className="space-y-2">
            <Label htmlFor="videoUrl" className="text-sm font-medium">
              Video URL *
            </Label>
            <div className="relative">
              <Input
                id="videoUrl"
                type="url"
                placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                value={videoUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className={`pr-10 ${!isValidUrl ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              <Link className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {!isValidUrl && (
              <div className="flex items-center space-x-1 text-red-600 text-xs">
                <AlertCircle className="h-3 w-3" />
                <span>Please enter a valid YouTube, Vimeo, or direct video file URL</span>
              </div>
            )}
            {isValidUrl && videoUrl && (
              <div className="flex items-center space-x-1 text-green-600 text-xs">
                <Play className="h-3 w-3" />
                <span>Detected: {getVideoType(videoUrl)} video</span>
              </div>
            )}
          </div>

          {/* Video Title Input */}
          <div className="space-y-2">
            <Label htmlFor="videoTitle" className="text-sm font-medium">
              Video Title (Optional)
            </Label>
            <Input
              id="videoTitle"
              type="text"
              placeholder="Describe the video content"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Helps with accessibility and SEO
            </p>
          </div>

          {/* Video Preview */}
          {embedUrl && isValidUrl && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview</Label>
              <Card className="p-4">
                <CardContent className="p-0">
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    {embedUrl.includes('youtube.com') || embedUrl.includes('vimeo.com') ? (
                      <iframe
                        src={embedUrl}
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                        frameBorder="0"
                        allowFullScreen
                        title={videoTitle || 'Video Preview'}
                      />
                    ) : (
                      <video
                        src={embedUrl}
                        controls
                        className="absolute top-0 left-0 w-full h-full rounded-lg object-cover"
                        title={videoTitle || 'Video Preview'}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Suggested Sources */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Supported Video Sources</Label>
            <div className="grid grid-cols-1 gap-2">
              {suggestedSources.map((source) => (
                <Card key={source.name} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{source.name}</h4>
                      <p className="text-xs text-gray-500">{source.description}</p>
                    </div>
                    {source.url !== '#' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(source.url, '_blank')}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
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
            disabled={!videoUrl || !isValidUrl}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Insert Video
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VideoDialog; 