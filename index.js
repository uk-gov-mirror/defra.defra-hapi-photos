const Boom = require('@hapi/boom')
const Photos = require('./lib/photos')
let photos

const register = async function (server, opts = {}) {
  const { path = '/photos', originalType = 'original', alternativeSizes = [], maxMb, minKb, payloadMaxBytes, region, apiVersion, bucket, options = {}, enabled = true } = opts

  const sizesAllowed = alternativeSizes.map(({ type: size }) => size)
  sizesAllowed.push(originalType)

  photos = new Photos({ region, apiVersion, bucket, originalType, alternativeSizes, maxMb, minKb, payloadMaxBytes, enabled })

  const handler = async (request, h) => {
    const filename = encodeURIComponent(request.params.filename)
    const size = encodeURIComponent(request.params.size)

    if (sizesAllowed.includes(size)) {
      // Get the photo and return with headers
      const photo = await photos.get(filename, size)
      return h.response(photo.Body).type(photo.ContentType)
    } else {
      return Boom.notFound()
    }
  }

  server.route({
    method: 'GET',
    path: `${path}/{size}/{filename}`,
    handler,
    options
  })
}

async function until (fn) {
  while (!fn()) {
    return Promise((resolve) => setTimeout(resolve, 0))
  }
}

exports.plugin = {
  name: 'defra-aws-photos',
  register,
  once: true,
  pkg: require('./package.json')
}

exports.Photos = Photos

exports.getPhotos = async () => {
  await until(() => photos)
  return photos
}
