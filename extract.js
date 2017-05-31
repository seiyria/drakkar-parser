
var _ = require('lodash');
var fs = require('fs-extra');
var PNG = require('pngjs').PNG;

// set up the index file for reading
var index = {
  drak24: fs.readFileSync('./drak24.ndx')
};

// set up the data file for reading
var data = {
  drak24: fs.readFileSync('./drak24.dat')
};

// remove the old images directory
fs.removeSync('images');
fs.ensureDirSync('images');

// keep track of total/current
var totalImages = 0;
var curImage = 0;

var getOffsetFromHeader = (header, type = 'drak24') => {
  var indexOfHeader = index[type].indexOf(header);
  return index[type].readUInt32LE(indexOfHeader-4);
};

var headerOffsetIntoNdx = (index) => {
  return 0x708 + 0x108 + index * 0xE0C;
};

// get every index of data at an offset from the ndx
var getAllDatIndicesFromNdx = (offset, type = 'drak24') => {
  var indices = [];

  for(var i = 0; i < 449*4; i+=4) {
    var repData = index[type].readUInt32LE(offset+i);
    if(repData === 0) return indices;

    indices.push(repData);
  }

  return indices;
};

// start getting all of the data based on an array of indices
var getDatDataFromIndices = (indices, sectionId, type, hasHeader, forceWidth, forceHeight) => {
  _.each(indices, index => parseData(index, sectionId, type, hasHeader, forceWidth, forceHeight));
};

// get the data from the dat into an image
var parseData = (i, sectionId, type = 'drak24', hasHeader = true, forceWidth = 0, forceHeight = 0) => {

  // header length on the image data
  var headerLength = hasHeader ? 14 : 0;

  // image length
  var itemLength = data[type].readUInt32LE(i+4) - headerLength;

  var dataOffset = 4 + 4 + 4; // 4 bytes for garbage (i+3 is the first 4 garbage bits), 4 bytes for image data length, 4 bytes for garbage

  // the actual string representing the item data
  var itemData = data[type].slice(i + dataOffset + headerLength, i + dataOffset + headerLength + itemLength);

  if(!itemData || itemData.length === 0) return;

  var itemDataHeader = data[type].slice(i + dataOffset, i + dataOffset + headerLength);

  // dimensions of the image
  var imageWidth = forceWidth ? forceWidth : itemDataHeader[2]; // itemDataImageLength.slice(2, 4).readUInt16LE(0);
  var imageHeight = forceHeight ? forceHeight : itemDataHeader[4]; // itemDataImageLength.slice(4, 6).readUInt16LE(0);

  if(!imageWidth || !imageHeight) return;

  var png = new PNG({
    width: imageWidth,
    height: imageHeight,
    // bgColor: { red: 0x00, green: 0x00, blue: 0x00 },
    inputHasAlpha: true
  });

  png.data[0] = 0;
  png.data[1] = 0;
  png.data[2] = 0;
  png.data[3] = 0;

  let numNodes = 1;

  // write the image data. it's not rgb, it's grb
  for(var j = 3; j < itemData.length; j+=3) {
    const pos = (numNodes++)*4;

    const g = itemData[j+2];
    const r = itemData[j+1];
    const b = itemData[j  ];

    if(g === 1 && r === 1 && b === 1) {
      png.data[pos] = png.data[pos+1] = png.data[pos+2] = png.data[pos+3] = 0;

    } else {
      png.data[pos  ] = g;
      png.data[pos+1] = r;
      png.data[pos+2] = b;
      png.data[pos+3] = 255;

    }

  }

  totalImages++;

  png
    .pack()
    .pipe(fs.createWriteStream(`images/${sectionId}-${curImage++}.png`))
    .on('error', (e) => console.error(e));
    // }
  // }
};

// parse the individual section of data either as a number or a lookup id
var parseSection = (id, type, hasHeader, width, height) => {
  console.log(`parsing ${id} - @image: ${totalImages}`);
  curImage = 0;

  var offset = _.isNumber(id) ? id : getOffsetFromHeader(id, type);
  var headerOffset = headerOffsetIntoNdx(offset);
  var dataIndices = getAllDatIndicesFromNdx(headerOffset, type);

  getDatDataFromIndices(dataIndices, id, type, hasHeader, width, height);
};

// drak24.dat
var drak24 = () => {
  var type = 'drak24';

  // ignore these sections of data
  var ignoreSections = [
    0, // terrain,
    1,
    2,
    3,
    4,
    5,
    8,
    9,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    25,
    32,
    33,
    34,
    35,
    36,
    37,
    38, // character portraits
    39, // character portraits
    40,
    41,
    42,
    43,
    44,
    45,
    46,
    47,
    48,
    49,
    50,
    51,
    52,
    53,
    54,
    55,
    56,
    57,
    58,
    59,
    60,
    61,
    62,
    63,
    64,
    65,
    66, // discs
    67
  ];

  // pass this data into the section parser
  var sectionArgs = {
    1:  { header: true, width: 64, height: 64 },
    2:  { header: true, width: 64, height: 64 },
    3:  { header: true, width: 64, height: 64 },
    4:  { header: true, width: 64, height: 64 },
    5:  { header: true, width: 64, height: 64 },
    6:  { header: true, width: 64, height: 64 },
    7:  { header: true, width: 64, height: 64 },
    8:  { header: true, width: 64, height: 64 },
    9:  { header: true, width: 64, height: 64 },
    10: { header: true, width: 64, height: 64 },
    11: { header: true, width: 64, height: 64 },
    12: { header: true, width: 64, height: 64 },
    13: { header: true, width: 64, height: 64 },
    14: { header: true, width: 64, height: 64 },
    15: { header: true, width: 64, height: 64 },
    16: { header: true, width: 64, height: 64 },
    17: { header: true, width: 64, height: 64 },
    18: { header: true, width: 64, height: 64 },
    19: { header: true, width: 64, height: 64 },
    20: { header: true, width: 64, height: 64 },
    21: { header: true, width: 64, height: 64 },
    22: { header: true, width: 64, height: 64 },
    23: { header: true, width: 64, height: 64 },
    24: { header: true, width: 64, height: 64 },
    25: { header: true, width: 64, height: 64 },
    26: { header: true, width: 64, height: 64 },
    27: { header: true, width: 64, height: 64 },
    28: { header: true, width: 64, height: 64 },
    29: { header: true, width: 64, height: 64 },
    30: { header: true, width: 64, height: 64 },
    31: { header: true, width: 64, height: 64 },
    32: { header: true, width: 64, height: 64 },
    33: { header: true, width: 64, height: 64 },
    35: { header: true, width: 64, height: 64 },
    36: { header: true, width: 64, height: 64 }
  };

  // check every section in the dat (some are ignored)
  for(var i = 0; i < 68; i++) {
    if(_.includes(ignoreSections, i)) continue;
    var opts = sectionArgs[i] || {};
    parseSection(i, type, opts.header, opts.width, opts.height);
  }

  // these are hardcoded sections that can be read, but instead integers are used above

  // parseSection('O241'); - character items held
  // parseSection('O242'); - character items held
  // parseSection('O243'); - character items held
  // parseSection('OAN1', type); // - this is good stuff, all the NL items
  // parseSection(0x1f + 1, type);
  // parseSection(0x1f + 2, type, false, 64, 64);
  // parseSection('OAN2'); //- ???
  // parseSection('OAN3'); //- ???
  // parseSection('TBUT'); - macro bar images
  // parseSection('DOBS'); - character portraits
  // parseSection('MSKN1'); - ???
  // parseSection('MKNE2'); - ???
  // parseSection('MSKE3'); - ???
  // parseSection('MKSE4'); - ???
  // parseSection('MSKS5'); - ???
  // parseSection('MKSW6'); - ???
  // parseSection('MSKW7'); - ???
  // parseSection('MKNW'); - ???
  // parseSection('SKLS', type); - skill trainer icons
  // parseSection('ADVS', type); - modal dialog icons
  // parseSection('DISC', type); - discipline boxes
  // parseSection('DK64', type, false, 64, 64);
  // parseSection('DK24', type, false, 24, 24);
}

drak24();

console.log('done');

/*
ImageMagick convert background to transparent:
for file in *.png; do convert "${file}" -transparent '#010101' "transparent/${file}"; done
*/
