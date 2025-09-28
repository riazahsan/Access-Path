# 🎯 Mobile AR Navigation Testing Guide

## 🚀 Quick Start

### 1. **Start the Development Server**
```bash
npm run dev
```

### 2. **Start ngrok for HTTPS (Required for iOS)**
```bash
npx ngrok http 8080
```

### 3. **Test on Mobile Device**
- Open the ngrok URL on your phone: `https://your-ngrok-url.ngrok-free.dev`
- Plan a route using the main app
- Click "Generate QR Code" 
- Scan the QR code with your phone's camera

## 🧪 Testing Steps

### **Step 1: Basic Connectivity Test**
1. Open: `https://your-ngrok-url.ngrok-free.dev/mobile-test.html`
2. This page tests:
   - ✅ Device orientation access
   - ✅ Geolocation access  
   - ✅ Camera access
   - ✅ All permissions working together

### **Step 2: AR Navigation Test**
1. Open: `https://your-ngrok-url.ngrok-free.dev`
2. Plan a route between two buildings
3. Click "Generate QR Code"
4. Scan QR code with phone
5. Grant camera and motion permissions
6. Test arrow rotation and direction

## 🔧 Troubleshooting

### **Common Issues & Solutions:**

#### **❌ "Camera access required" on iOS**
- **Cause**: iOS requires HTTPS for camera access
- **Solution**: Use ngrok for HTTPS tunneling
- **Test**: Visit `mobile-test.html` to verify permissions

#### **❌ Arrow doesn't move when device rotates**
- **Cause**: Device orientation permission not granted
- **Solution**: 
  1. Tap the "Test" button to simulate rotation
  2. Check browser console for orientation values
  3. Try refreshing and granting permissions again

#### **❌ Camera feed disappears after permissions**
- **Cause**: Permission request order issue
- **Solution**: The app now requests orientation first, then camera
- **Test**: Use the "Test" button to verify functionality

#### **❌ Duration shows 2 minutes instead of 4 minutes**
- **Cause**: Hardcoded duration in route response
- **Solution**: ✅ **FIXED** - Now calculates realistic duration based on distance

#### **❌ Orientation freezes when scrolling**
- **Cause**: iOS Safari stops orientation events during scroll
- **Solution**: ✅ **FIXED** - Added scroll prevention and proper event handling

## 📱 Mobile-Specific Features

### **Test Button**
- **Purpose**: Simulates device rotation for testing
- **Usage**: Tap to rotate arrow by 45° each time
- **Debug**: Check console logs for rotation values

### **Compass Display**
- **Purpose**: Shows current device heading
- **Format**: N, NE, E, SE, S, SW, W, NW + degrees

### **AR Arrow**
- **Purpose**: Points toward destination
- **Color**: Red with pulsing animation
- **Behavior**: Rotates based on device heading vs. destination bearing

## 🎯 Expected Behavior

### **✅ Working Correctly:**
1. **Camera displays immediately** without scrolling
2. **Duration matches** between main app and mobile (4 minutes for test route)
3. **Arrow responds to device rotation** or Test button
4. **Console logs show** heading and rotation calculations
5. **No orientation freezing** when touching screen

### **🔍 Debug Information:**
- **User location** (lat/lng)
- **Target waypoint** (lat/lng) 
- **Bearing calculation** (direction to target)
- **User heading** (device compass direction)
- **Arrow rotation** (final rotation applied)

## 📋 Test Checklist

- [ ] Server running on `localhost:8080`
- [ ] ngrok tunnel active and HTTPS working
- [ ] Mobile device can access ngrok URL
- [ ] Route planning works in main app
- [ ] QR code generation works
- [ ] QR code scanning opens mobile app
- [ ] Camera permission granted
- [ ] Device orientation permission granted
- [ ] Arrow rotates when device moves
- [ ] Test button rotates arrow by 45°
- [ ] Console logs show proper calculations
- [ ] Duration matches between apps
- [ ] No scrolling/orientation freezing

## 🚨 Known Issues

1. **iOS Safari**: Requires HTTPS for camera/geolocation
2. **Device Orientation**: May need manual permission on iOS 13+
3. **Scroll Prevention**: Some browsers may still allow minimal scrolling

## 💡 Tips for Success

1. **Always use HTTPS** via ngrok for mobile testing
2. **Grant permissions in order**: Orientation → Camera
3. **Use Test button** to verify arrow rotation logic
4. **Check console logs** for debugging information
5. **Test on actual device** - simulators don't have real sensors

## 🔗 URLs for Testing

- **Main App**: `https://your-ngrok-url.ngrok-free.dev`
- **Mobile AR**: `https://your-ngrok-url.ngrok-free.dev/mobile`
- **Test Page**: `https://your-ngrok-url.ngrok-free.dev/mobile-test.html`

---

**Happy Testing! 🎯📱**
