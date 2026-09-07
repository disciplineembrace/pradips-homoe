import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';
import 'materia_medica_screen.dart';
import 'repertory_screen.dart';
import 'search_screen.dart';
import 'settings_screen.dart';
import 'about_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  
  final _screens = [
    const DashboardTab(),
    const MateriaMedicaScreen(),
    const RepertoryScreen(),
    const SearchScreen(),
    const SettingsScreen(),
  ];
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Pradip's Homeo"),
        actions: [
          IconButton(
            icon: const Icon(Icons.brightness_6),
            onPressed: () => context.read<ThemeProvider>().toggleTheme(),
          ),
        ],
      ),
      drawer: const AppDrawer(),
      body: _screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.medical_services), label: 'MM'),
          NavigationDestination(icon: Icon(Icons.library_books), label: 'Repertory'),
          NavigationDestination(icon: Icon(Icons.search), label: 'Search'),
          NavigationDestination(icon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }
}

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(color: AppTheme.primaryGreen),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                const CircleAvatar(
                  radius: 30,
                  backgroundColor: AppTheme.gold,
                  child: Icon(Icons.person, size: 36, color: Colors.white),
                ),
                const SizedBox(height: 12),
                Text(
                  auth.userName ?? 'User',
                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                Text(
                  auth.userRole?.toUpperCase() ?? '',
                  style: TextStyle(color: AppTheme.gold.withAlpha(200), fontSize: 12),
                ),
              ],
            ),
          ),
          _drawerItem(context, Icons.medical_services, 'Materia Medica', () => Navigator.pop(context)),
          _drawerItem(context, Icons.library_books, 'Repertory', () => Navigator.pop(context)),
          _drawerItem(context, Icons.healing, 'Therapeutics', () => Navigator.pop(context)),
          _drawerItem(context, Icons.local_hospital, 'Clinical', () => Navigator.pop(context)),
          _drawerItem(context, Icons.search, 'Quick Search', () => Navigator.pop(context)),
          _drawerItem(context, Icons.menu_book, 'Organon', () => Navigator.pop(context)),
          _drawerItem(context, Icons.school, 'Segal Homeopathy', () => Navigator.pop(context)),
          _drawerItem(context, Icons.auto_stories, 'Predictive Homeopathy', () => Navigator.pop(context)),
          _drawerItem(context, Icons.merge_type, 'Synthesis', () => Navigator.pop(context)),
          _drawerItem(context, Icons.analytics, 'Analysis Tools', () => Navigator.pop(context)),
          _drawerItem(context, Icons.quiz, 'Exam Hub', () => Navigator.pop(context)),
          _drawerItem(context, Icons.book, 'Books', () => Navigator.pop(context)),
          const Divider(),
          _drawerItem(context, Icons.info, 'About', () {
            Navigator.pop(context);
            Navigator.push(context, MaterialPageRoute(builder: (_) => const AboutScreen()));
          }),
          _drawerItem(context, Icons.contact_page, 'Contact', () => Navigator.pop(context)),
          _drawerItem(context, Icons.person, 'Profile', () => Navigator.pop(context)),
          _drawerItem(context, Icons.settings, 'Settings', () => Navigator.pop(context)),
          const Divider(),
          _drawerItem(context, Icons.logout, 'Logout', () async {
            await auth.logout();
          }, isLogout: true),
        ],
      ),
    );
  }
  
  Widget _drawerItem(BuildContext context, IconData icon, String label, VoidCallback onTap, {bool isLogout = false}) {
    return ListTile(
      leading: Icon(icon, color: isLogout ? Colors.red : AppTheme.primaryGreen),
      title: Text(label, style: TextStyle(color: isLogout ? Colors.red : null)),
      onTap: onTap,
    );
  }
}

class DashboardTab extends StatelessWidget {
  const DashboardTab({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Welcome back!', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 8),
          Text('Pradip\'s Homeo — Personal Digital Homeopathy Library',
            style: TextStyle(color: Colors.grey[600], fontSize: 14)),
          const SizedBox(height: 24),
          
          // Stats grid
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.2,
            children: [
              _statCard(context, '3,658', 'Remedies', Icons.medical_services),
              _statCard(context, '88,211', 'Rubrics', Icons.library_books),
              _statCard(context, '180,386', 'Synthesis', Icons.merge_type),
              _statCard(context, '10', 'Authors', Icons.people),
            ],
          ),
          const SizedBox(height: 24),
          
          // Quick access
          Text('Quick Access', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 3,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: 1,
            children: [
              _quickCard(context, 'Materia Medica', Icons.medical_services, AppTheme.primaryGreen),
              _quickCard(context, 'Repertory', Icons.library_books, AppTheme.darkMaroon),
              _quickCard(context, 'Synthesis', Icons.merge_type, AppTheme.gold),
              _quickCard(context, 'Search', Icons.search, Colors.blue),
              _quickCard(context, 'Therapeutics', Icons.healing, Colors.teal),
              _quickCard(context, 'Books', Icons.book, Colors.indigo),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _statCard(BuildContext context, String number, String label, IconData icon) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: AppTheme.primaryGreen),
            const SizedBox(height: 8),
            Text(number, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.primaryGreen)),
            Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
          ],
        ),
      ),
    );
  }
  
  Widget _quickCard(BuildContext context, String label, IconData icon, Color color) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {},
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(label, textAlign: TextAlign.center, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}
