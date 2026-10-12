import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Re:Story — Writing workspace',description:'Research story context, plan alternate timelines, and write your own drafts.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
