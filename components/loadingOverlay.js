import React, { useState, useEffect } from 'react'
import { FadeLoader } from 'react-spinners'

export default function LoadingOverlay({ text = 'Loading...' }) {
  return (
    <div className="loading-overlay">
      <FadeLoader
        color={'#0d5cab'}
        height={15}
        loading
        margin={2}
        radius={2}
        speedMultiplier={1}
        width={5}
      />
      <span className="p fs-1 my-3">{text}</span>
    </div>
  )
}
