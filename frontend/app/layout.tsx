import './globals.css';

export const metadata = { 
  title: "The Pheonix Analytics", 
  description: "Premium Analytics & Tech Learning Platform - 16 Tracks, 85 Courses" 
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}