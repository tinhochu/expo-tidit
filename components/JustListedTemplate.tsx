// JustListedTemplateExport.tsx
import React, { useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Rect, Image as SvgImage, Text as SvgText } from 'react-native-svg'
import { captureRef } from 'react-native-view-shot'

const W = 1080
const H = 1350 // 4:5 for Instagram

export default function JustListedTemplate({ imageUrl }: { imageUrl: string }) {
  const captureViewRef = useRef<View>(null)
  const [busy, setBusy] = useState(false)

  //   async function exportPNG() {
  //     try {
  //       setBusy(true)
  //       // Capture the wrapper view as PNG; result is a local file URI
  //       const uri = await captureRef(captureViewRef, {
  //         format: 'png',
  //         quality: 1,
  //         result: 'tmpfile',
  //       })

  //       // Save to Photos (ask permission if needed)
  //       const { status } = await MediaLibrary.requestPermissionsAsync()
  //       if (status !== 'granted') {
  //         Alert.alert('Permission needed', 'Please allow Photos permission to save the image.')
  //         return
  //       }
  //       await MediaLibrary.saveToLibraryAsync(uri)
  //       Alert.alert('Saved ✅', 'Your image was saved to Photos.')
  //     } catch (e: any) {
  //       Alert.alert('Export failed', String(e?.message ?? e))
  //     } finally {
  //       setBusy(false)
  //     }
  //   }

  //   async function sharePNG() {
  //     try {
  //       setBusy(true)
  //       const uri = await captureRef(captureViewRef, {
  //         format: 'png',
  //         quality: 1,
  //         result: 'tmpfile',
  //       })
  //       await Sharing.shareAsync(uri)
  //     } catch (e: any) {
  //       Alert.alert('Share failed', String(e?.message ?? e))
  //     } finally {
  //       setBusy(false)
  //     }
  //   }

  return (
    <View style={styles.screen}>
      {/* Wrapper view to capture (IMPORTANT: collapsable={false} helps Android capture) */}
      <View
        ref={captureViewRef}
        collapsable={false}
        style={{ width: W / 2, height: H / 2, transform: [{ scale: 1 }], borderRadius: 12, overflow: 'hidden' }}
      >
        {/* We render the SVG at full logical size with viewBox, so capture is crisp */}
        <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
          {/* Background photo */}
          <SvgImage href={{ uri: imageUrl }} x="0" y="0" width={W} height={H} preserveAspectRatio="xMidYMid slice" />

          {/* Bottom overlay for legibility */}
          <Rect x="0" y={H - 420} width={W} height={420} fill="rgba(0,0,0,0.55)" />

          {/* Ribbon (simple bar) */}
          <Rect x="0" y="60" width="680" height="120" rx="20" fill="#111" />
          <SvgText x="40" y="140" fontSize="72" fontWeight="bold" fill="#fff">
            JUST LISTED
          </SvgText>

          {/* Address / meta */}
          <SvgText x="540" y={H - 270} textAnchor="middle" fontSize="56" fontWeight="bold" fill="#fff">
            123 Main St
          </SvgText>
          <SvgText x="540" y={H - 200} textAnchor="middle" fontSize="40" fill="#eaeaea">
            Austin, TX
          </SvgText>
          <SvgText x="540" y={H - 130} textAnchor="middle" fontSize="36" fill="#fff">
            $825,000 • 3 bd • 2 ba • 1,980 sqft
          </SvgText>
        </Svg>
      </View>

      {/* <View style={styles.actions}>
        <Pressable style={[styles.btn, busy && styles.btnDisabled]} onPress={exportPNG} disabled={busy}>
          <Text style={styles.btnText}>{busy ? 'Processing…' : 'Save PNG'}</Text>
        </Pressable>
        <Pressable style={[styles.btnOutline, busy && styles.btnDisabled]} onPress={sharePNG} disabled={busy}>
          <Text style={styles.btnOutlineText}>Share</Text>
        </Pressable>
      </View> */}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f6f6', gap: 16 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { backgroundColor: '#111', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
  btnOutline: { borderWidth: 1, borderColor: '#111', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  btnOutlineText: { color: '#111', fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
})
