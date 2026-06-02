package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = GrassLight,
    secondary = SoilLight,
    tertiary = Gold,
    background = DarkBackground,
    surface = Color(0xFF162512),
    onPrimary = Color.Black,
    onSecondary = Color.White,
    onBackground = Color(0xFFECEFF1),
    onSurface = Color(0xFFECEFF1)
)

private val LightColorScheme = lightColorScheme(
    primary = Grass,
    secondary = Soil,
    tertiary = GoldDark,
    background = LightSurface,
    surface = CardBackgroundLight,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFF1E2E1F),
    onSurface = Color(0xFF1E2E1F)
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
