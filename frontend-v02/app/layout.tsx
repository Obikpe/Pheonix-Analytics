import "./globals.css";
import {Manrope,DM_Serif_Display,JetBrains_Mono} from "next/font/google";
const manrope=Manrope({subsets:["latin"],variable:"--font-manrope",display:"swap"});
const display=DM_Serif_Display({subsets:["latin"],variable:"--font-display",weight:"400",display:"swap"});
const mono=JetBrains_Mono({subsets:["latin"],variable:"--font-mono",display:"swap"});
export const metadata={title:"Learnora ME — Learn. Practise. Build. Prove.",description:"Learnora is a practical learning and skills platform for learners, instructors and organisations."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={manrope.variable+" "+display.variable+" "+mono.variable}>{children}</body></html>}