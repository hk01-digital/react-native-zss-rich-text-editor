import { call, put, all } from 'redux-saga/effects'
import { delay } from 'redux-saga'
import TextEditorActions from '../Redux/TextEditorRedux'

const indexOf = require('ramda/src/indexOf')
const path = require('ramda/src/path')
const pathOr = require('ramda/src/pathOr')
const prop = require('ramda/src/prop')

export function * uploadImage (api, { images }) {
  try {
    const response = yield call(api.uploadImage, images)
    const imageResponse = path(['data', 'images'], response) 
    
    const imgLocalId = prop('localId', images[0])

    if (response.ok && Array.isArray(imageResponse)) {
      yield all(
        imageResponse.map(image => {
          const imgUrl = prop('url', image)
          const mediaId = prop('mediaId', image)
    
          return put(
            TextEditorActions.textEditorSuccess(
              imgUrl,
              mediaId,
              imgLocalId
            )
          )
        })
      )
    } else {
      const errorCodes = pathOr([], ['data', 'errors'], response)
      // only use first error code for error message
      const firstErrorCode = pathOr(null, ['data', 'errors', 0], response)
      console.log('uploadImage error :', response)
      yield put(
        TextEditorActions.textEditorFailure(
          pathOr(null, ['data'], response),
          imgLocalId
        )
      )
    }
  } catch(e) {
    // TODO: handle error
    console.log('uploadImage error :', e)
  }
}
