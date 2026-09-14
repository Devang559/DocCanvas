# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep Parcelable classes
-keepnames class * implements android.os.Parcelable
-keep class * implements android.os.Parcelable
-keep class * implements android.os.Parcelable$Creator

# React Native
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.module.annotations.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class io.github.react_native_community.netinfo.** { *; }
-keep class io.github.react_native_community.netinfo.** { *; }

# react-native-svg
-keep class com.h6ahhadbits.widget.** { *; }
-keep class com.reactcommunity.rnsvg.** { *; }
-keep class com.reactcommunity.rnsvg.* { *; }

# react-native-fs
-keep class com.rnfs.** { *; }
-dontwarn com.rnfs.**

# react-native-html-to-pdf
-keep class com.christiankandroid.html2pdf.** { *; }
-dontwarn com.christiankandroid.html2pdf.**
-keep class com.itextpdf.** { *; }
-dontwarn com.itextpdf.**

# react-native-image-picker
-keep class com.imagepicker.** { *; }
-dontwarn com.imagepicker.**

# AsyncStorage
-keep class com.reactnative.asyncstorage.** { *; }
-dontwarn com.reactnative.asyncstorage.**

# Gson
-dontwarn com.google.gson.**
-keep class com.google.gson.** { *; }
-keep class kotlin.Metadata { *; }
-keepattributes RuntimeVisibleAnnotations,AnnotationDefault

