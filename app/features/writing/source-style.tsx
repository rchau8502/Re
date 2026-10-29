'use client';
import {defaultSourceStyle,sourceMedia,type SourceStyle} from '@/lib/modules/writing/source-style';
export function SourceStyleSettings({value,change}:{value?:SourceStyle;change:(next:SourceStyle)=>void}){
 const style=value || defaultSourceStyle();
 return <details><summary>Original storytelling style</summary>
  <label className="toggle"><input type="checkbox" checked={style.followOriginal} onChange={e=>change({...style,followOriginal:e.target.checked})}/>Follow source storytelling style</label>
  <label>Source medium<select aria-label="Source medium" value={style.medium} onChange={e=>change({...style,medium:e.target.value as SourceStyle['medium']})}>{sourceMedia.map(m=><option key={m}>{m}</option>)}</select></label>
  <label>Source style notes<textarea aria-label="Source style notes" rows={5} maxLength={3000} value={style.notes} onChange={e=>change({...style,notes:e.target.value})} placeholder="Viewpoint, pacing, dialogue, visual storytelling, and details that should stay faithful to the source."/></label>
  <p className="muted">Use the correct adaptation or edition. Film, animation and comics inform scene rhythm and visual detail; prose stays prose. Your alternate outcome remains the goal. Add reference notes when source traits are uncertain.</p>
 </details>;
}
