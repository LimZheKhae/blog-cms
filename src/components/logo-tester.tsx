'use client'

import Image from 'next/image'

export function LogoTester() {
  const logos = [
    { name: 'Original', src: '/zenith-logo.svg' },
    { name: 'Minimal', src: '/zenith-minimal.svg' },
    { name: 'Modern', src: '/zenith-modern.svg' },
    { name: '3D Style', src: '/zenith-3d.svg' },
    { name: 'Improved', src: '/zenith-logo-improved.svg' },
  ]

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center">Zenith Logo Comparison</h1>
      
      {/* Light Background Test */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">On Light Background</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {logos.map((logo) => (
            <div key={logo.name} className="text-center">
              <div className="bg-white p-6 rounded-lg shadow-md mb-2 flex items-center justify-center">
                <Image 
                  src={logo.src} 
                  alt={logo.name}
                  width={64} 
                  height={64}
                  className="w-16 h-16"
                />
              </div>
              <p className="text-sm font-medium">{logo.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dark Background Test */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">On Dark Background</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {logos.map((logo) => (
            <div key={logo.name} className="text-center">
              <div className="bg-gray-900 p-6 rounded-lg shadow-md mb-2 flex items-center justify-center">
                <Image 
                  src={logo.src} 
                  alt={logo.name}
                  width={64} 
                  height={64}
                  className="w-16 h-16"
                />
              </div>
              <p className="text-sm font-medium">{logo.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Navbar Size Test */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Navbar Size (32px)</h2>
        <div className="flex items-center space-x-8 bg-white p-4 rounded-lg shadow-md">
          {logos.map((logo) => (
            <div key={logo.name} className="flex items-center space-x-2">
              <Image 
                src={logo.src} 
                alt={logo.name}
                width={32} 
                height={32}
                className="w-8 h-8"
              />
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Zenith
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Small Size Test */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Small Size (16px) - Favicon</h2>
        <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-md">
          {logos.map((logo) => (
            <div key={logo.name} className="text-center">
              <Image 
                src={logo.src} 
                alt={logo.name}
                width={16} 
                height={16}
                className="w-4 h-4 mx-auto mb-1"
              />
              <p className="text-xs">{logo.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 