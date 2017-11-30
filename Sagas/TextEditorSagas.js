import { call, put } from 'redux-saga/effects'
import TextEditorActions from '../Redux/TextEditorRedux'

const indexOf = require('ramda/src/indexOf')
const path = require('ramda/src/path')
const pathOr = require('ramda/src/pathOr')

export function * uploadImage (api, { image }) {
  try {
    const response = yield call(api.uploadImage, image)
    // TODO: update response path later
    const imgId = path(['data', 'data', 'balanceDisplay'], response)
    const imgOriginalSize = pathOr(
      false,
      ['data', 'data', 'isWhitelisted'],
      response
    )
    const imgUrl = pathOr([], ['data', 'data', 'transactions'], response)
  
    if (response.ok) {
      yield put(
          TextEditorActions.textEditorSuccess(
              "img_id",
              "200x200",
              "https://cloud.netlifyusercontent.com/assets/344dbf88-fdf9-42bb-adb4-46f01eedd629/68dd54ca-60cf-4ef7-898b-26d7cbe48ec7/10-dithering-opt.jpg",
        )
      )
    } else {
      const errorCodes = pathOr([], ['data', 'errors'], response)
      // only use first error code for error message
      const firstErrorCode = pathOr(null, ['data', 'errors', 0], response)
      yield put(
          TextEditorActions.textEditorFailure(
          "123"
        )
      )
    }
  } catch(e) {
    // TODO: handle error
  }
}
