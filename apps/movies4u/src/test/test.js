import ffmpeg from 'fluent-ffmpeg';

// HLS master playlist URL
const masterPlaylistUrl =
  'https://pdrz.v421c6e485f.site/_v2-lrld/12a3c523fc105800ed8c394685aeeb0b9b2ea15c00bdbeed0a0e7baea93ece832257df1a4b6125fcfa38c35da05dee86aad28d46d73fc4e9d4e5a53a5277f3d537c512e30918b40d5691a6b039107b126566d1700700379a93d9e159d4e62e9a7942a11c563de701f1ad6d5de2/h/list;ecddaaeae1/ccdeeffb;15a38634f803584ba8926411d7bee906856cab0654b5b7.m3u8';

// Function to fetch and parse HLS master playlist
async function fetchAndParseMasterPlaylist(url) {
  const response = await fetch(url);
  const playlistText = await response.text();
  const lines = playlistText.split('\n');
  const variantPlaylists = [];
  let currentVariant = {};
  for (const line of lines) {
    if (line.startsWith('#EXT-X-STREAM-INF')) {
      if (currentVariant.url) {
        variantPlaylists.push(currentVariant);
      }
      currentVariant = {};
      const match = line.match(/BANDWIDTH=(\d+),RESOLUTION=(\d+x\d+)/);
      if (match) {
        currentVariant.bandwidth = parseInt(match[1]);
        currentVariant.resolution = match[2];
      }
    } else if (line.trim().startsWith('http')) {
      currentVariant.url = line.trim();
    }
  }
  if (currentVariant.url) {
    variantPlaylists.push(currentVariant);
  }
  return variantPlaylists;
}

// Function to load HLS variant playlist and extract segment URLs
async function loadVariantPlaylist(variantUrl) {
  const response = await fetch(variantUrl);
  const playlistText = await response.text();
  const lines = playlistText.split('\n');
  const segmentUrls = lines.filter((line) => line.trim().startsWith('http'));
  return segmentUrls;
}

// Function to load segments from variant playlists
async function loadSegmentsFromVariants(variantPlaylists) {
  for (const variant of variantPlaylists) {
    console.log(
      `Loading segments from variant with bandwidth ${variant.bandwidth} and resolution ${variant.resolution}`
    );
    const segmentUrls = await loadVariantPlaylist(variant.url);
    // You can handle the segment URLs here (e.g., load each segment using ffmpeg)
    console.log('Segment URLs:', segmentUrls);
  }
}

// Main function to load HLS segments
async function loadHlsSegments() {
  try {
    // Fetch and parse HLS master playlist
    const variantPlaylists = await fetchAndParseMasterPlaylist(
      masterPlaylistUrl
    );

    // Load segments from variant playlists
    console.log(variantPlaylists, 'kkemkdmek');
    await loadSegmentsFromVariants(variantPlaylists);

    console.log('All segments loaded successfully.');
  } catch (error) {
    console.error('Error loading segments:', error);
  }
}

// Run main function
loadHlsSegments();

//https://s1.ridoo.net/hls2/01/00004/,ui8b4fld1gan_n,ui8b4fld1gan_x,lang/eng/ui8b4fld1gan_eng,.urlset/master.m3u8?t=kl02BfoxXLELFQDvycKIfXcUDw4vI2cbXWvBupSHVZ4&s=1713378490&e=3599996400&f=24291&i=0.0&sp=0&fr=ui8b4fld1gan

//https://s1.ridoo.net/hls2/01/00004/,ui8b4fld1gan_n,ui8b4fld1gan_x,lang/eng/ui8b4fld1gan_eng,.urlset/index-f2-v1-a2.m3u8?t=kl02BfoxXLELFQDvycKIfXcUDw4vI2cbXWvBupSHVZ4&s=1713378490&e=3599996400&f=24291&i=0.0&sp=0&fr=ui8b4fld1gan
