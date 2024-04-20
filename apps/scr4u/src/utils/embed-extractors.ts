import { Stream } from '@movie-web/providers';
import { SourcererEmbed, StreamWithQulaities } from '../types';

interface StreamInfo {
  [resolution: number]: {
    url: string;
    type: string;
  };
}

export async function vidplayExtractor(
  stream: Stream & { playlist: string }
): Promise<StreamWithQulaities> {
  const response = await fetch(stream.playlist);
  const data = await response.text();
  const lines = data.split('\n');
  const streamInfos: StreamInfo[] = [];
  //const streamWithQualities: StreamWithQulaities = { ...stream, qualities: {} };

  ///console.log(lines, 'djcjcjjd');

  let qualities: any[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXT-X-STREAM-INF')) {
      const resolutionMatch = line.match(/RESOLUTION=(\d+x\d+)/);

      if (resolutionMatch) {
        const resolution = resolutionMatch[1];
        const right = resolutionMatch[1].substring(resolution.indexOf('x') + 1);
        let url = lines[i + 1].trim();
        const index = stream.playlist.lastIndexOf('/h/');
        if (index !== -1) {
          url = stream.playlist.slice(0, index) + `/h/${url}`;
        }
        qualities?.push({ [right]: { resolution, url } });
      }
    }
  }

  const streamWithQualities = {
    ...stream,
    qualities: qualities as [{ url: string; resolution: string }],
  };
  return streamWithQualities;
  //return streamInfos;
}
