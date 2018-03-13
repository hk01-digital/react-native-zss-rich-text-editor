// ApiClient for new API
import apisauce from 'apisauce'
import Config from 'react-native-config'
import { select } from 'redux-saga/effects'
import apiEndpoints from '../Config/TextEditorEndpoints'
import type { ApiClient } from '../types/api'

const compose = require('ramda/src/compose')
const map = require('ramda/src/map')

const ugcJwtSelector = state => state.tokens.getIn(['tokens', 'ugc', 'token'])

const create = (baseURL = Config.UGC_API_BASE_URL): ApiClient => {
  const api = apisauce.create({
    baseURL,
    headers: {
      'Cache-Control': 'no-cache'
    },
    timeout: 10000
  })

  if (__DEV__ && console.tron) {
    api.addMonitor(console.tron.apisauce)
  }

  const uploadImage = function * (images) {
    const ugcJwt = yield select(ugcJwtSelector)
    api.setHeader('authorization', `Bearer ${ugcJwt}`)
    api.setHeader('Content-Type', `multipart/form-data`)
    api.setHeader('Accept', `application/json`)

    const data = new FormData()

    images.map(image => {
      data.append('images[]', {
        uri: image.path,
        // name is required by spec, but not used by backend
        // avoid using real filename here because non-ascii character will crash
        // https://tools.ietf.org/html/rfc7578#section-4.2
        name: 'filename',
        type: image.mime ? image.mime : 'image/jpeg'
      })
    })

    return yield api.post(apiEndpoints.uploadImage, data)
  }

  return {
    uploadImage,
  }
}

export default {
  create
}
