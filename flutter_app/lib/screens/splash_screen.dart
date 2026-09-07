import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.primaryGreen,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(40),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: const Icon(
                Icons.local_hospital,
                size: 56,
                color: AppTheme.primaryGreen,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              "Pradip's Homeo",
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Personal Digital Homeopathy Library',
              style: TextStyle(
                color: AppTheme.gold.withAlpha(200),
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 40),
            const SizedBox(
              width: 32,
              height: 32,
              child: CircularProgressIndicator(
                color: AppTheme.gold,
                strokeWidth: 3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
