import fs from 'node:fs';
const file='src/assets/mepamo_mascot_waving.svg';let svg=fs.readFileSync(file,'utf8');
const changes=[
['M86 140 C86 102 126 54 187 53 C247 50 290 90 294 130 C301 176 270 205 233 205 L173 207 C123 209 84 194 86 140 Z','M194 53 C221 53 245 61 263 77 C283 97 294 119 294 140 C294 164 284 183 267 195 C256 202 245 205 233 205 L173 207 C155 207 140 205 128 198 C102 185 86 165 86 140 C86 117 103 94 126 77 C148 60 170 53 194 53 Z'],
['M126 77 C163 112 170 164 128 198 C101 189 84 167 86 140 C87 117 103 92 126 77 Z','M126 77 C159 108 173 159 128 198 C102 185 86 165 86 140 C86 117 103 94 126 77 Z'],
['M263 77 C236 108 229 156 267 191 C288 177 297 157 294 134 C292 112 280 90 263 77 Z','M263 77 C232 108 228 157 267 195 C284 183 294 164 294 140 C294 119 283 97 263 77 Z']
];
for(const [before,after] of changes){if(!svg.includes(before))throw Error('Expected original head path missing');svg=svg.replace(before,after)}
svg=svg.replace('<!-- Head and cream eye panels. -->','<!-- Rounded head and curved cream panels, updated to the supplied close-up reference. -->');fs.writeFileSync(file,svg);
let tests=fs.readFileSync('tests/artwork.spec.ts','utf8');tests=tests.replace('expect(geometry.actual).toEqual(geometry.original);','expect(geometry.actual.map((d,i)=>d!==geometry.original[i]?i:-1).filter(i=>i>=0)).toEqual([7,8,9]);');fs.writeFileSync('tests/artwork.spec.ts',tests);
let docs=fs.readFileSync('README.md','utf8');docs=docs.replace('its path geometry, colors, gradients, outlines and grey shadow remain unchanged.','its colors, gradients, outlines and grey shadow remain unchanged. The head contour and two cream eye-panel paths were subsequently rounded to match the supplied close-up reference; all other paths, including the mouth, remain unchanged.');fs.writeFileSync('README.md',docs);
