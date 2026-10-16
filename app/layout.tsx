import type {Metadata} from 'next';
import './globals.css';
import './studio.css';
export const metadata:Metadata={title:'Re:Story — Stories into motion',description:'Create novels, explore alternate endings, and turn story moments into short videos. Your words, your worlds, your possibilities.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
